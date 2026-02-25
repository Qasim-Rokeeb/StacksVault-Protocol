;; StackVault Protocol
;; Decentralized liquidity vault for STX assets

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-FUNDS (err u101))
(define-constant ERR-MIN-DEPOSIT (err u102))

;; Data Vars
(define-data-var total-liquidity uint u0)

;; Data Maps
(define-map VaultBalances
    principal
    {
        amount: uint,
        last-deposit-height: uint
    }
)

;; Public Functions

;; @desc Deposit STX into the vault
;; @param amount: The amount of STX to deposit (in micro-STX)
(define-public (deposit-liquidity (amount uint))
    (let (
        (current-balance (get amount (default-to { amount: u0, last-deposit-height: u0 } (map-get? VaultBalances tx-sender))))
    )
        ;; Minimum deposit of 1 STX (1,000,000 micro-STX)
        (asserts! (>= amount u1000000) ERR-MIN-DEPOSIT)
        
        ;; Transfer STX from user to contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update user balance
        (map-set VaultBalances tx-sender {
            amount: (+ current-balance amount),
            last-deposit-height: block-height
        })
        
        ;; Update total liquidity
        (var-set total-liquidity (+ (var-get total-liquidity) amount))
        
        (ok true)
    )
)

;; @desc Withdraw STX from the vault
;; @param amount: The amount of STX to withdraw
(define-public (withdraw-liquidity (amount uint))
    (let (
        (user-data (unwrap! (map-get? VaultBalances tx-sender) ERR-INSUFFICIENT-FUNDS))
        (current-balance (get amount user-data))
    )
        ;; Check if user has enough balance
        (asserts! (<= amount current-balance) ERR-INSUFFICIENT-FUNDS)
        
        ;; Transfer STX from contract to user
        (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
        
        ;; Update user balance
        (map-set VaultBalances tx-sender {
            amount: (- current-balance amount),
            last-deposit-height: block-height
        })
        
        ;; Update total liquidity
        (var-set total-liquidity (- (var-get total-liquidity) amount))
        
        (ok true)
    )
)

;; Read-only Functions

;; @desc Get the balance of a specific user
(define-read-only (get-balance (user principal))
    (ok (get amount (default-to { amount: u0, last-deposit-height: u0 } (map-get? VaultBalances user))))
)

;; @desc Get the total liquidity in the vault
(define-read-only (get-total-liquidity)
    (ok (var-get total-liquidity))
)
