import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRConfig extends Document {
  empresaId: string;
  mpValidationEnabled: boolean;
  afipInvoicingEnabled: boolean;
  autoProcessWhatsApp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OCRConfigSchema = new Schema<IOCRConfig>(
  {
    empresaId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    mpValidationEnabled: {
      type: Boolean,
      default: false
    },
    afipInvoicingEnabled: {
      type: Boolean,
      default: false
    },
    autoProcessWhatsApp: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const OCRConfig = mongoose.model<IOCRConfig>('OCRConfig', OCRConfigSchema);
