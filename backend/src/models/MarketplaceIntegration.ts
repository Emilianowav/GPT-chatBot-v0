// 🔌 Modelo de Integración de Marketplace
import mongoose, { Schema, Document } from 'mongoose';

export type IntegrationProvider = 
  | 'google_calendar' 
  | 'google_sheets'
  | 'google_drive' 
  | 'outlook_calendar'
  | 'zoom' 
  | 'slack'
  | 'woocommerce'
  | 'zapier'
  | 'microsoft_teams';

export type IntegrationStatus = 'active' | 'expired' | 'revoked' | 'error';

export interface OAuthCredentials {
  access_token: string;      // Encriptado
  refresh_token: string;     // Encriptado
  token_type: string;        // "Bearer"
  expires_at: Date;          // Timestamp de expiración
  scope: string;             // Scopes otorgados
}

export interface GoogleCalendarConfig {
  calendar_ids?: string[];   // IDs de calendarios a sincronizar
  sync_interval?: number;    // Minutos entre sincronizaciones
  auto_sync?: boolean;       // Sincronización automática
  sync_past_days?: number;   // Días hacia atrás para sincronizar
  sync_future_days?: number; // Días hacia adelante para sincronizar
  default_calendar_id?: string; // Calendario por defecto
}

export interface WooCommerceConfig {
  store_url: string;         // URL de la tienda
  webhook_secret?: string;   // Secret para validar webhooks
  sync_products?: boolean;   // Sincronizar productos
  sync_orders?: boolean;     // Sincronizar órdenes
  sync_customers?: boolean;  // Sincronizar clientes
  order_statuses?: string[]; // Estados de órdenes a sincronizar
  sync_interval?: number;    // Minutos entre sincronizaciones
  auto_sync?: boolean;       // Sincronización automática
}

export interface GoogleSheetsConfig {
  spreadsheet_ids?: string[]; // IDs de hojas a las que tiene acceso
  default_spreadsheet_id?: string; // Hoja por defecto
  auto_sync?: boolean;        // Sincronización automática
  sync_interval?: number;     // Minutos entre sincronizaciones
  read_only?: boolean;        // Solo lectura
}

export interface IntegrationConfig {
  google_calendar?: GoogleCalendarConfig;
  google_sheets?: GoogleSheetsConfig;
  woocommerce?: WooCommerceConfig;
  // Futuros providers aquí
  [key: string]: any;
}

export interface IMarketplaceIntegration extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Relaciones
  empresaId: string;              // Ref: Empresa.nombre
  usuarioEmpresaId: mongoose.Types.ObjectId; // Ref: UsuarioEmpresa._id (quien conectó)
  
  // Tipo de integración
  provider: IntegrationProvider;
  provider_name: string;          // Nombre legible: "Google Calendar"
  
  // Credenciales OAuth (ENCRIPTADAS)
  credentials: OAuthCredentials;
  
  // Estado
  status: IntegrationStatus;
  granted_scopes: string[];       // Lista de permisos específicos
  connected_account: string;      // Email/ID de la cuenta conectada
  
  // Configuración específica del provider
  config: IntegrationConfig;
  
  // Sincronización
  last_sync?: Date;
  next_sync?: Date;
  sync_count: number;
  sync_errors: number;
  
  // Errores
  error_message?: string;
  last_error?: Date;
  
  // Auditoría
  createdBy: mongoose.Types.ObjectId; // Ref: UsuarioEmpresa._id
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  isTokenExpiringSoon(): boolean;
  isTokenExpired(): boolean;
  calculateNextSync(): Date;
}

const OAuthCredentialsSchema = new Schema<OAuthCredentials>(
  {
    access_token: { type: String, required: true },
    refresh_token: { type: String, required: true },
    token_type: { type: String, default: 'Bearer' },
    expires_at: { type: Date, required: true },
    scope: { type: String, required: true }
  },
  { _id: false }
);

const MarketplaceIntegrationSchema = new Schema<IMarketplaceIntegration>(
  {
    // Relaciones
    empresaId: {
      type: String,
      required: true,
      index: true
    },
    usuarioEmpresaId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'UsuarioEmpresa'
    },
    
    // Tipo de integración
    provider: {
      type: String,
      required: true,
      enum: ['google_calendar', 'google_sheets', 'google_drive', 'outlook_calendar', 'zoom', 'slack', 'woocommerce', 'zapier', 'microsoft_teams'],
      index: true
    },
    provider_name: {
      type: String,
      required: true
    },
    
    // Credenciales OAuth (ENCRIPTADAS)
    credentials: {
      type: OAuthCredentialsSchema,
      required: true
    },
    
    // Estado
    status: {
      type: String,
      required: true,
      enum: ['active', 'expired', 'revoked', 'error'],
      default: 'active',
      index: true
    },
    granted_scopes: {
      type: [String],
      default: []
    },
    connected_account: {
      type: String,
      required: true
    },
    
    // Configuración específica del provider
    config: {
      type: Schema.Types.Mixed,
      default: {}
    },
    
    // Sincronización
    last_sync: {
      type: Date
    },
    next_sync: {
      type: Date,
      index: true
    },
    sync_count: {
      type: Number,
      default: 0
    },
    sync_errors: {
      type: Number,
      default: 0
    },
    
    // Errores
    error_message: {
      type: String
    },
    last_error: {
      type: Date
    },
    
    // Auditoría
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'UsuarioEmpresa'
    }
  },
  {
    timestamps: true,
    collection: 'marketplace_integrations'
  }
);

// Índices compuestos
MarketplaceIntegrationSchema.index({ empresaId: 1, provider: 1 }); // Una integración por provider por empresa
MarketplaceIntegrationSchema.index({ empresaId: 1, status: 1 });
MarketplaceIntegrationSchema.index({ status: 1, expires_at: 1 }); // Para refresh automático
MarketplaceIntegrationSchema.index({ status: 1, next_sync: 1 }); // Para sincronización automática

// Método para verificar si el token está próximo a expirar (menos de 5 minutos)
MarketplaceIntegrationSchema.methods.isTokenExpiringSoon = function(): boolean {
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return this.credentials.expires_at <= fiveMinutesFromNow;
};

// Método para verificar si el token ya expiró
MarketplaceIntegrationSchema.methods.isTokenExpired = function(): boolean {
  return this.credentials.expires_at <= new Date();
};

// Método para calcular próxima sincronización
MarketplaceIntegrationSchema.methods.calculateNextSync = function(): Date {
  const config = this.config[this.provider] || {};
  const intervalMinutes = config.sync_interval || 30; // Default 30 minutos
  return new Date(Date.now() + intervalMinutes * 60 * 1000);
};

export const MarketplaceIntegrationModel = mongoose.model<IMarketplaceIntegration>(
  'MarketplaceIntegration',
  MarketplaceIntegrationSchema
);
