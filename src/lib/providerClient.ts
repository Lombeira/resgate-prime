import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';
import { getEnv } from './env';
import { Decimal } from 'decimal.js';

/**
 * Interface unificada para provedores (Mercado Bitcoin, Parfin)
 */

export interface OrderRequest {
  pair: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  amountBrl: Decimal;
  price?: Decimal;
}

export interface OrderResponse {
  id: string;
  status: 'PLACED' | 'FILLED' | 'PARTIAL' | 'CANCELLED';
  executedAmount?: Decimal;
  executedPrice?: Decimal;
  createdAt: Date;
}

export interface WithdrawRequest {
  asset: string;
  network: string;
  amount: Decimal;
  address: string;
}

export interface WithdrawResponse {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'CONFIRMED';
  txHash?: string;
  fee?: Decimal;
}

export interface BalanceResponse {
  asset: string;
  available: Decimal;
  locked: Decimal;
  total: Decimal;
}

/**
 * Cliente base abstrato para provedores
 */
abstract class BaseProviderClient {
  protected client: AxiosInstance;
  protected apiKey: string;
  protected apiSecret: string;

  constructor(baseURL: string, apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ResgatePrime/1.0',
      },
    });

    // Interceptor para adicionar autenticação
    this.client.interceptors.request.use((config) => {
      return this.addAuthHeaders(config);
    });

    // Interceptor para logging e retry
    this.client.interceptors.response.use(
      (response) => response,
      this.handleError.bind(this)
    );
  }

  protected abstract addAuthHeaders(config: any): any;

  abstract createOrder(request: OrderRequest): Promise<OrderResponse>;
  abstract getOrder(orderId: string): Promise<OrderResponse>;
  abstract createWithdraw(request: WithdrawRequest): Promise<WithdrawResponse>;
  abstract getWithdraw(withdrawId: string): Promise<WithdrawResponse>;
  abstract getBalance(asset: string): Promise<BalanceResponse>;

  protected async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      console.error('❌ Provider API Error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('❌ Provider Network Error:', error.message);
    }
    throw error;
  }
}

/**
 * Cliente Mercado Bitcoin
 */
class MercadoBitcoinClient extends BaseProviderClient {
  protected addAuthHeaders(config: any): any {
    const timestamp = Date.now().toString();
    const path = new URL(config.url, config.baseURL).pathname;
    const body = config.data ? JSON.stringify(config.data) : '';

    // Assinatura MB: HMAC-SHA256(timestamp + method + path + body)
    const message = `${timestamp}${config.method?.toUpperCase()}${path}${body}`;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');

    config.headers['X-MB-ACCESS-KEY'] = this.apiKey;
    config.headers['X-MB-ACCESS-TIMESTAMP'] = timestamp;
    config.headers['X-MB-ACCESS-SIGNATURE'] = signature;

    return config;
  }

  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    const response = await this.client.post('/v4/orders', {
      symbol: request.pair.replace('-', ''),
      side: request.side.toLowerCase(),
      type: request.type.toLowerCase(),
      quantity: request.amountBrl.toString(),
    });

    return {
      id: response.data.orderId,
      status: this.mapOrderStatus(response.data.status),
      executedAmount: response.data.executedQty
        ? new Decimal(response.data.executedQty)
        : undefined,
      executedPrice: response.data.avgPrice
        ? new Decimal(response.data.avgPrice)
        : undefined,
      createdAt: new Date(response.data.createdAt),
    };
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    const response = await this.client.get(`/v4/orders/${orderId}`);

    return {
      id: response.data.orderId,
      status: this.mapOrderStatus(response.data.status),
      executedAmount: response.data.executedQty
        ? new Decimal(response.data.executedQty)
        : undefined,
      executedPrice: response.data.avgPrice
        ? new Decimal(response.data.avgPrice)
        : undefined,
      createdAt: new Date(response.data.createdAt),
    };
  }

  async createWithdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
    const response = await this.client.post('/v4/withdraw', {
      coin: request.asset,
      network: request.network,
      address: request.address,
      amount: request.amount.toString(),
    });

    return {
      id: response.data.id,
      status: 'PENDING',
      fee: response.data.fee ? new Decimal(response.data.fee) : undefined,
    };
  }

  async getWithdraw(withdrawId: string): Promise<WithdrawResponse> {
    const response = await this.client.get(`/v4/withdraw/${withdrawId}`);

    return {
      id: response.data.id,
      status: this.mapWithdrawStatus(response.data.status),
      txHash: response.data.txHash,
      fee: response.data.fee ? new Decimal(response.data.fee) : undefined,
    };
  }

  async getBalance(asset: string): Promise<BalanceResponse> {
    const response = await this.client.get('/v4/accounts/balance');
    const balance = response.data.balances.find((b: any) => b.asset === asset);

    if (!balance) {
      throw new Error(`Asset ${asset} não encontrado`);
    }

    return {
      asset: balance.asset,
      available: new Decimal(balance.available),
      locked: new Decimal(balance.locked),
      total: new Decimal(balance.available).plus(balance.locked),
    };
  }

  private mapOrderStatus(status: string): OrderResponse['status'] {
    const mapping: Record<string, OrderResponse['status']> = {
      new: 'PLACED',
      filled: 'FILLED',
      partially_filled: 'PARTIAL',
      cancelled: 'CANCELLED',
    };
    return mapping[status] || 'PLACED';
  }

  private mapWithdrawStatus(status: string): WithdrawResponse['status'] {
    const mapping: Record<string, WithdrawResponse['status']> = {
      pending: 'PENDING',
      processing: 'PROCESSING',
      sent: 'SENT',
      confirmed: 'CONFIRMED',
    };
    return mapping[status] || 'PENDING';
  }
}

/**
 * Cliente Parfin (estrutura similar, adaptar conforme API real)
 */
class ParfinClient extends BaseProviderClient {
  protected addAuthHeaders(config: any): any {
    // Implementar autenticação Parfin
    config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    return config;
  }

  async createOrder(request: OrderRequest): Promise<OrderResponse> {
    // Implementar conforme API Parfin
    throw new Error('Parfin client não implementado');
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    throw new Error('Parfin client não implementado');
  }

  async createWithdraw(request: WithdrawRequest): Promise<WithdrawResponse> {
    throw new Error('Parfin client não implementado');
  }

  async getWithdraw(withdrawId: string): Promise<WithdrawResponse> {
    throw new Error('Parfin client não implementado');
  }

  async getBalance(asset: string): Promise<BalanceResponse> {
    throw new Error('Parfin client não implementado');
  }
}

/**
 * Factory para criar cliente baseado no provider configurado
 */
export function createProviderClient(): BaseProviderClient {
  const env = getEnv();

  switch (env.PROVIDER_NAME) {
    case 'mercado_bitcoin':
      return new MercadoBitcoinClient(
        env.PROVIDER_API_URL,
        env.PROVIDER_API_KEY,
        env.PROVIDER_API_SECRET
      );
    case 'parfin':
      return new ParfinClient(
        env.PROVIDER_API_URL,
        env.PROVIDER_API_KEY,
        env.PROVIDER_API_SECRET
      );
    default:
      throw new Error(`Provider desconhecido: ${env.PROVIDER_NAME}`);
  }
}

// Singleton
let providerClient: BaseProviderClient | null = null;

export function getProviderClient(): BaseProviderClient {
  if (!providerClient) {
    providerClient = createProviderClient();
  }
  return providerClient;
}
