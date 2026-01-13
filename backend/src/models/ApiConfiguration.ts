import mongoose, { Schema, Document } from 'mongoose';

export interface IApiConfiguration extends Document {
  name: string;
  type: 'woocommerce' | 'mercadopago' | 'other';
  baseUrl: string;
  auth?: {
    consumerKey?: string;
    consumerSecret?: string;
    accessToken?: string;
  };
  endpoints?: Array<{
    id: string;
    name: string;
    method: string;
    path: string;
    description?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ApiConfigurationSchema = new Schema<IApiConfiguration>({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['woocommerce', 'mercadopago', 'other'] },
  baseUrl: { type: String, required: true },
  auth: {
    consumerKey: String,
    consumerSecret: String,
    accessToken: String,
  },
  endpoints: [{
    id: String,
    name: String,
    method: String,
    path: String,
    description: String,
  }],
}, {
  timestamps: true,
  collection: 'api_configurations'
});

export const ApiConfigurationModel = mongoose.model<IApiConfiguration>('ApiConfiguration', ApiConfigurationSchema);
