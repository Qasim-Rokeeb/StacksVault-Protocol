import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that user can deposit liquidity",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const amount = 5000000; // 5 STX

        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(amount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Check balance
        let balanceResult = chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectOk().expectUint(amount);

        // Check total liquidity
        let totalLiquidity = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectOk().expectUint(amount);
    },
});

Clarinet.test({
    name: "Ensure that user can withdraw liquidity",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const depositAmount = 10000000; // 10 STX
        const withdrawAmount = 4000000; // 4 STX

        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(depositAmount)], wallet_1.address)
        ]);

        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "withdraw", [types.uint(withdrawAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Check remaining balance
        let balanceResult = chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectOk().expectUint(depositAmount - withdrawAmount);

        // Check total liquidity
        let totalLiquidity = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectOk().expectUint(depositAmount - withdrawAmount);
    },
});

Clarinet.test({
    name: "Ensure that user cannot withdraw more than balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const depositAmount = 5000000; // 5 STX
        const withdrawAmount = 6000000; // 6 STX

        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(depositAmount)], wallet_1.address)
        ]);

        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "withdraw", [types.uint(withdrawAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(101); // ERR-INSUFFICIENT-FUNDS
    },
});

Clarinet.test({
    name: "Ensure multiple users can interact with the vault",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const wallet_2 = accounts.get("wallet_2")!;
        const amount1 = 5000000; // 5 STX
        const amount2 = 3000000; // 3 STX

        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(amount1)], wallet_1.address),
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(amount2)], wallet_2.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectBool(true);

        // Check total liquidity
        let totalLiquidity = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectOk().expectUint(amount1 + amount2);

        // Wallet 1 withdraws
        block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "withdraw", [types.uint(2000000)], wallet_1.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);

        // Check total liquidity after withdrawal
        totalLiquidity = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectOk().expectUint(amount1 + amount2 - 2000000);
        
        // Final balances
        chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address)
            .result.expectOk().expectUint(3000000);
        chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_2.address)], wallet_2.address)
            .result.expectOk().expectUint(3000000);
    },
});

Clarinet.test({
    name: "Ensure minimum deposit requirement is enforced",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const smallAmount = 500000; // 0.5 STX

        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(smallAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(102); // ERR-MIN-DEPOSIT
    },
});

Clarinet.test({
    name: "Ensure yield accrues correctly over time (1 year simulate)",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const amount = 100000000; // 100 STX
        const blocksInYear = 52560;

        // Deposit
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(amount)], wallet_1.address)
        ]);

        // Mine 1 year worth of blocks
        chain.mineEmptyBlockUntil(blocksInYear + 3); // Accommodate initial blocks

        // Check balance (should be 100 STX + 5% APY = 105 STX)
        let balanceResult = chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectOk().expectUint(amount + 5000000);

        // Check total liquidity also includes yield
        // Let's claim yield to update the on-chain var
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "claim-yield", [], wallet_1.address)
        ]);

        let finalTotalLiquidity = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        finalTotalLiquidity.result.expectOk().expectUint(amount + 5000000);
    },
});

Clarinet.test({
    name: "Ensure yield is checkpointed during subsequent deposits",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const initialDeposit = 100000000; // 100 STX
        const halfYearBlocks = 26280;
        const secondDeposit = 100000000; // 100 STX

        // Initial Deposit
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(initialDeposit)], wallet_1.address)
        ]);

        // Mine 0.5 year worth of blocks
        chain.mineEmptyBlockUntil(halfYearBlocks + 3);

        // Second Deposit (should trigger yield accrual)
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(secondDeposit)], wallet_1.address)
        ]);

        // Check balance (should be 100 + 100 + 2.5 yield = 202.5 STX)
        let balanceResult = chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectOk().expectUint(initialDeposit + secondDeposit + 2500000);
    },
});

Clarinet.test({
    name: "Ensure owner can pause and unpause the protocol",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;

        // Check initially not paused
        let status = chain.callReadOnlyFn("stackvault-protocol", "is-protocol-paused", [], wallet_1.address);
        status.result.expectBool(false);

        // Non-owner cannot pause
        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "pause-protocol", [], wallet_1.address)
        ]);
        block.receipts[0].result.expectErr().expectUint(100); // ERR-NOT-AUTHORIZED

        // Owner pauses
        block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "pause-protocol", [], deployer.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);

        // Verify paused state
        status = chain.callReadOnlyFn("stackvault-protocol", "is-protocol-paused", [], wallet_1.address);
        status.result.expectBool(true);

        // Owner resumes
        block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "resume-protocol", [], deployer.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(false);

        status = chain.callReadOnlyFn("stackvault-protocol", "is-protocol-paused", [], wallet_1.address);
        status.result.expectBool(false);
    },
});

Clarinet.test({
    name: "Ensure deposit, withdraw, and claim revert when paused while reads succeed",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;
        const depositAmount = 10000000; // 10 STX

        // Deposit successfully before pause
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(depositAmount)], wallet_1.address)
        ]);

        // Owner pauses
        chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "pause-protocol", [], deployer.address)
        ]);

        // Operations should error
        let block = chain.mineBlock([
            Tx.contractCall("stackvault-protocol", "deposit-liquidity", [types.uint(depositAmount)], wallet_1.address),
            Tx.contractCall("stackvault-protocol", "withdraw", [types.uint(1000000)], wallet_1.address),
            Tx.contractCall("stackvault-protocol", "claim-yield", [], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 3);
        block.receipts[0].result.expectErr().expectUint(103); // ERR-PAUSED
        block.receipts[1].result.expectErr().expectUint(103);
        block.receipts[2].result.expectErr().expectUint(103);

        // Read operations should still succeed
        chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address)
            .result.expectOk().expectUint(depositAmount);
            
        // Wait blocks to accrue yield
        chain.mineEmptyBlockUntil(10);
        
        // Accrued yield getter succeeds
        let yieldRes = chain.callReadOnlyFn("stackvault-protocol", "get-accrued-yield", [types.principal(wallet_1.address)], wallet_1.address);
        yieldRes.result.expectOk();

        let totalLiqRes = chain.callReadOnlyFn("stackvault-protocol", "get-total-liquidity", [], wallet_1.address);
        totalLiqRes.result.expectOk().expectUint(depositAmount);
        
        let pauseRes = chain.callReadOnlyFn("stackvault-protocol", "is-protocol-paused", [], wallet_1.address);
        pauseRes.result.expectBool(true);
    },
});
