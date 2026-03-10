;; Vault Contract
;; Handles STX deposits and tracking user balances

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-MIN-DEPOSIT (err u102))

;; Data Vars
(define-data-var total-liquidity uint u0)

;; Data Maps
(define-map user-balances principal uint)

;; Public Functions

;; @desc Deposit STX into the vault
;; @param amount: The amount of STX to deposit (in micro-STX)
(define-public (deposit (amount uint))
    (begin
        ;; Minimum deposit of 1 STX
        (asserts! (>= amount u1000000) ERR-MIN-DEPOSIT)
        
        ;; Transfer STX from sender to contract
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update user balance
        (map-set user-balances tx-sender (+ (get-user-balance tx-sender) amount))
        
        ;; Update total liquidity
        (var-set total-liquidity (+ (var-get total-liquidity) amount))
        
        (ok true)
    )
)

;; Read-only Functions

;; @desc Get the balance of a specific user
;; @param user: The principal to check
(define-read-only (get-user-balance (user principal))
    (default-to u0 (map-get? user-balances user))
)

;; @desc Get total liquidity in the vault
(define-read-only (get-total-liquidity)
    (var-get total-liquidity)
)
