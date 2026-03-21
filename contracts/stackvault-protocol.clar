;; StackVault Protocol
;; Decentralized liquidity vault for STX assets with yield generation

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-FUNDS (err u101))
(define-constant ERR-MIN-DEPOSIT (err u102))
(define-constant ERR-PAUSED (err u103))

;; Yield Constants (5% APY = 500/10000)
(define-constant YIELD-PRECISION u10000)
(define-constant YIELD-APY u500)
(define-constant BLOCKS-PER-YEAR u52560)

;; Data Vars
(define-data-var total-liquidity uint u0)
(define-data-var protocol-paused bool false)

;; Data Maps
(define-map VaultBalances
    principal
    {
        amount: uint,
        last-reward-height: uint
    }
)

;; Private Functions

;; @desc Calculate accrued yield for a user
(define-private (calculate-accrued-yield (user principal))
    (let (
        (user-data (default-to { amount: u0, last-reward-height: block-height } (map-get? VaultBalances user)))
        (balance (get amount user-data))
        (last-height (get last-reward-height user-data))
        (blocks-passed (- block-height last-height))
    )
        (if (or (is-eq balance u0) (is-eq blocks-passed u0))
            u0
            ;; Yield = (Balance * APY * BlocksPassed) / (Precision * BlocksPerYear)
            (/ (* (* balance YIELD-APY) blocks-passed) (* YIELD-PRECISION BLOCKS-PER-YEAR))
        )
    )
)

;; @desc Checkpoint yield: calculate and add to balance
(define-private (accrue-yield (user principal))
    (let (
        (accrued (calculate-accrued-yield user))
        (current-data (default-to { amount: u0, last-reward-height: block-height } (map-get? VaultBalances user)))
    )
        (if (> accrued u0)
            (begin
                (map-set VaultBalances user {
                    amount: (+ (get amount current-data) accrued),
                    last-reward-height: block-height
                })
                (var-set total-liquidity (+ (var-get total-liquidity) accrued))
                (ok accrued)
            )
            (begin
                ;; Just update the height if no yield accrued yet
                (map-set VaultBalances user {
                    amount: (get amount current-data),
                    last-reward-height: block-height
                })
                (ok u0)
            )
        )
    )
)

;; Public Functions

;; @desc Deposit STX into the vault
;; @param amount: The amount of STX to deposit (in micro-STX)
(define-public (deposit-liquidity (amount uint))
    (begin
        ;; Ensure protocol is active
        (asserts! (not (var-get protocol-paused)) ERR-PAUSED)
        
        ;; Accrue existing yield first
        (try! (accrue-yield tx-sender))
        
        (let (
            (current-balance (get amount (default-to { amount: u0, last-reward-height: block-height } (map-get? VaultBalances tx-sender))))
        )
            ;; Minimum deposit of 1 STX
            (asserts! (>= amount u1000000) ERR-MIN-DEPOSIT)
            
            ;; Transfer STX from user to contract
            (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
            
            ;; Update user balance (reward height already updated in accrue-yield)
            (map-set VaultBalances tx-sender {
                amount: (+ current-balance amount),
                last-reward-height: block-height
            })
            
            ;; Update total liquidity
            (var-set total-liquidity (+ (var-get total-liquidity) amount))
            
            (ok true)
        )
    )
)

;; @desc Withdraw STX from the vault
;; @param amount: The amount of STX to withdraw
(define-public (withdraw (amount uint))
    (begin
        ;; Ensure protocol is active
        (asserts! (not (var-get protocol-paused)) ERR-PAUSED)
        
        ;; Accrue existing yield first
        (try! (accrue-yield tx-sender))
        
        (let (
            (user-data (unwrap! (map-get? VaultBalances tx-sender) ERR-INSUFFICIENT-FUNDS))
            (current-balance (get amount user-data))
            (caller tx-sender)
        )
            ;; Check if user has enough balance
            (asserts! (<= amount current-balance) ERR-INSUFFICIENT-FUNDS)
            
            ;; Transfer STX from contract to user
            (try! (as-contract (stx-transfer? amount tx-sender caller)))
            
            ;; Update user balance
            (map-set VaultBalances caller {
                amount: (- current-balance amount),
                last-reward-height: block-height
            })
            
            ;; Update total liquidity
            (var-set total-liquidity (- (var-get total-liquidity) amount))
            
            (ok true)
        )
    )
)

;; @desc Manually claim accrued yield
(define-public (claim-yield)
    (begin
        (asserts! (not (var-get protocol-paused)) ERR-PAUSED)
        (accrue-yield tx-sender)
    )
)

;; Admin Functions

;; @desc Pause the protocol (admin only)
(define-public (pause-protocol)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (ok (var-set protocol-paused true))
    )
)

;; @desc Resume the protocol (admin only)
(define-public (resume-protocol)
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (ok (var-set protocol-paused false))
    )
)

;; Read-only Functions

;; @desc Get the balance of a specific user (including unaccrued yield)
(define-read-only (get-balance (user principal))
    (let (
        (user-data (default-to { amount: u0, last-reward-height: block-height } (map-get? VaultBalances user)))
        (accrued (calculate-accrued-yield user))
    )
        (ok (+ (get amount user-data) accrued))
    )
)

;; @desc Get only the accrued yield for a user
(define-read-only (get-accrued-yield (user principal))
    (ok (calculate-accrued-yield user))
)

;; @desc Get the total liquidity in the vault
(define-read-only (get-total-liquidity)
    (ok (var-get total-liquidity))
)

;; @desc Check if protocol is paused
(define-read-only (is-protocol-paused)
    (var-get protocol-paused)
)
