import { StacksApiSocketClient } from "@stacks/blockchain-api-client";
import {
  fetchCallReadOnlyFunction,
  TxRejectedReason,
} from "@stacks/transactions";

export class BlockChainDataAggregator {
  private apiClient: StacksApiSocketClient;
  private baseUrl: string = "https://api.testnet.hiro.so";
  private userAddress: string = "";

  constructor() {
    this.apiClient = new StacksApiSocketClient();
  }

  async aggregateUserData(address: string): Promise<any> {
    console.log(`[Aggregator] Collecting data for ${address}...`);

    // Establecer la dirección del usuario una vez
    this.userAddress = address;

    try {
      const [transactionHistory] = await Promise.all([
        this.getTransactionHistory(),
      ]);

      return {
        transactionHistory,
      };
    } catch (error) {
      console.error(
        `[Aggregator] Error collecting data for ${address}:`,
        error
      );
      throw error;
    }
  }

  async getTransactionHistory(): Promise<any[]> {
    const response = await fetch(
      `${this.baseUrl}/extended/v1/address/${this.userAddress}/transactions?limit=50`
    );
    const data = await response.json();
    return data.results || [];
  }

  calculateWalletAge(txs: any[]): number {
    if (!txs || txs.length === 0) return 0;

    const oldestTx = txs.reduce((oldest, current) => {
      return current.burn_block_time < oldest.burn_block_time
        ? current
        : oldest;
    });

    const ageMs = Date.now() - oldestTx.burn_block_time * 1000;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24)); // Días
  }

  async getCurrentBalance(): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/extended/v1/address/${this.userAddress}/balances`
      );
      const data = await response.json();

      // Balance en microSTX, convertir a STX
      return parseInt(data.stx.balance) / 1_000_000;
    } catch (error) {
      console.error("[Aggregator] Error getting balance:", error);
      return 0;
    }
  }

  getMaxBalance(transfers: any[]): number {
    if (transfers.length === 0) return 0;

    let balance = 0;
    let maxBalance = 0;

    // Reconstruir historial de balance
    // Ordenar por tiempo (más antiguo primero)
    const sorted = [...transfers].sort(
      (a, b) => a.burn_block_time - b.burn_block_time
    );

    for (const tx of sorted) {
      const fee = parseInt(tx.fee_rate || "0") / 1_000_000;

      if (tx.tx_type === "token_transfer") {
        const amount = parseInt(tx.token_transfer?.amount || "0") / 1_000_000;

        if (tx.sender_address === tx.token_transfer?.recipient_address) {
          continue; // Auto-transferencia
        }

        if (tx.token_transfer?.recipient_address === this.userAddress) {
          balance += amount; // Recibido
        } else if (tx.sender_address === this.userAddress) {
          balance -= amount; // Enviado
        }
      }

      // Restar fee si el address es el sender
      if (tx.sender_address === this.userAddress) {
        balance -= fee;
      }

      maxBalance = Math.max(maxBalance, balance);
    }

    return maxBalance;
  }

  calculateMonthlyAverage(txs: any[]): number {
    if (txs.length === 0) return 0;

    const walletAgeDays = this.calculateWalletAge(txs);
    if (walletAgeDays === 0) return 0;

    const months = walletAgeDays / 30;
    return months > 0 ? txs.length / months : 0;
  }

  calculateVolatility(transfers: any[]): number {
    if (transfers.length < 2) return 0;

    const balances: number[] = [];
    let currentBalance = 0;

    const sorted = [...transfers].sort(
      (a, b) => a.burn_block_time - b.burn_block_time
    );

    for (const tx of sorted) {
      if (tx.tx_type === "token_transfer") {
        const amount = parseInt(tx.token_transfer?.amount || "0") / 1_000_000;
        const fee = parseInt(tx.fee_rate || "0") / 1_000_000;

        // Si recibe tokens
        if (tx.token_transfer?.recipient_address === this.userAddress) {
          currentBalance += amount;
        }

        // Si envía tokens (restar monto + fee)
        if (tx.sender_address === this.userAddress) {
          currentBalance -= amount;
          currentBalance -= fee;
        }

        balances.push(currentBalance);
      }
    }

    if (balances.length < 2) return 0;

    // Calcular desviación estándar
    const mean = balances.reduce((a, b) => a + b, 0) / balances.length;
    const variance =
      balances.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      balances.length;

    const stdDev = Math.sqrt(variance);

    // Retornar como porcentaje del promedio
    return mean > 0 ? (stdDev / mean) * 100 : stdDev;
  }

  analyzeWeekendActivity(txs: any[]): number {
    if (txs.length === 0) return 0;

    let weekendTxs = 0;

    for (const tx of txs) {
      const date = new Date(tx.burn_block_time * 1000);
      const dayOfWeek = date.getDay();

      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTxs++;
      }
    }

    return (weekendTxs / txs.length) * 100;
  }

  analyzeLateNightActivity(txs: any[]): number {
    if (txs.length === 0) return 0;

    let lateNightTxs = 0;

    for (const tx of txs) {
      const date = new Date(tx.burn_block_time * 1000);
      const hour = date.getHours();

      // 11pm (23) hasta 5am (5)
      if (hour >= 23 || hour <= 5) {
        lateNightTxs++;
      }
    }

    return (lateNightTxs / txs.length) * 100;
  }
}

// Ejemplo de uso
const aggregator = new BlockChainDataAggregator();

aggregator
  .aggregateUserData("ST23JSMGR5933QJ329PKPNNQJV6QG8Z9D33QBYDNX")
  .then(async (data) => {
    const txs = data.transactionHistory;

    const age = aggregator.calculateWalletAge(txs);
    const balance = await aggregator.getCurrentBalance();
    const maxBalance = aggregator.getMaxBalance(txs);
    const monthlyAverage = aggregator.calculateMonthlyAverage(txs);
    const volatility = aggregator.calculateVolatility(txs);
    const weekendActivity = aggregator.analyzeWeekendActivity(txs);
    const lateNightActivity = aggregator.analyzeLateNightActivity(txs);

    console.log(`Wallet age in days: ${age}`);
    console.log(`Current balance in STX: ${balance}`);
    console.log(`Max historical balance in STX: ${maxBalance}`);
    console.log(`Monthly average transactions: ${monthlyAverage}`);
    console.log(`Volatility: ${volatility}%`);
    console.log(`Weekend activity percentage: ${weekendActivity}%`);
    console.log(`Late night activity percentage: ${lateNightActivity}%`);
  });
