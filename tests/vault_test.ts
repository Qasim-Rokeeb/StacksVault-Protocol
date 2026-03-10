import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that user can deposit STX into vault",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const depositAmount = 5000000; // 5 STX

        let block = chain.mineBlock([
            Tx.contractCall("vault", "deposit", [types.uint(depositAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk().expectBool(true);

        // Check user balance
        let balanceResult = chain.callReadOnlyFn("vault", "get-user-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectUint(depositAmount);

        // Check total liquidity
        let totalLiquidity = chain.callReadOnlyFn("vault", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectUint(depositAmount);
    },
});

Clarinet.test({
    name: "Ensure that minimum deposit requirement is enforced in vault",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const smallAmount = 500000; // 0.5 STX

        let block = chain.mineBlock([
            Tx.contractCall("vault", "deposit", [types.uint(smallAmount)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectErr().expectUint(102); // ERR-MIN-DEPOSIT
    },
});

Clarinet.test({
    name: "Ensure that multiple deposits from same user are cumulative",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;
        const firstDeposit = 2000000; // 2 STX
        const secondDeposit = 3000000; // 3 STX

        let block = chain.mineBlock([
            Tx.contractCall("vault", "deposit", [types.uint(firstDeposit)], wallet_1.address),
            Tx.contractCall("vault", "deposit", [types.uint(secondDeposit)], wallet_1.address)
        ]);

        assertEquals(block.receipts.length, 2);
        block.receipts[0].result.expectOk().expectBool(true);
        block.receipts[1].result.expectOk().expectBool(true);

        // Check cumulative balance
        let balanceResult = chain.callReadOnlyFn("vault", "get-user-balance", [types.principal(wallet_1.address)], wallet_1.address);
        balanceResult.result.expectUint(firstDeposit + secondDeposit);

        // Check total liquidity
        let totalLiquidity = chain.callReadOnlyFn("vault", "get-total-liquidity", [], wallet_1.address);
        totalLiquidity.result.expectUint(firstDeposit + secondDeposit);
    },
});
