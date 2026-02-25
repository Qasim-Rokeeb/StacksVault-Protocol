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
            Tx.contractCall("stackvault-protocol", "withdraw-liquidity", [types.uint(withdrawAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Check remaining balance
        let balanceResult = chain.callReadOnlyFn("stackvault-protocol", "get-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectOk().expectUint(depositAmount - withdrawAmount);
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
            Tx.contractCall("stackvault-protocol", "withdraw-liquidity", [types.uint(withdrawAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(101); // ERR-INSUFFICIENT-FUNDS
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
