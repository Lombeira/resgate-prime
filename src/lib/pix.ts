/**
 * Utilitários para gerar QR Code PIX
 * Formato EMV padrão brasileiro
 */

export interface PixData {
  pixKey: string;
  amount?: number;
  description?: string;
  merchantName?: string;
  merchantCity?: string;
}

/**
 * Gera payload PIX no formato EMV
 * Compatível com apps bancários brasileiros
 */
export function generatePixPayload(data: PixData): string {
  const {
    pixKey,
    amount,
    description = 'Doacao Resgate Prime',
    merchantName = 'RESGATE PRIME',
    merchantCity = 'SAO PAULO',
  } = data;

  const payload: string[] = [];

  // Payload Format Indicator (01)
  payload.push('01' + '02' + '01');

  // Merchant Account Information (26)
  const merchantInfo = `0014BR.GOV.BCB.PIX01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
  payload.push('26' + merchantInfo.length.toString().padStart(2, '0') + merchantInfo);

  // Merchant Category Code (52)
  payload.push('52' + '04' + '0000');

  // Transaction Currency (53) - BRL = 986
  payload.push('53' + '03' + '986');

  // Transaction Amount (54)
  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2).replace('.', '');
    payload.push('54' + amountStr.length.toString().padStart(2, '0') + amountStr);
  } else {
    payload.push('54' + '02' + '00');
  }

  // Country Code (58)
  payload.push('58' + '02' + 'BR');

  // Merchant Name (59)
  payload.push('59' + merchantName.length.toString().padStart(2, '0') + merchantName);

  // Merchant City (60)
  payload.push('60' + merchantCity.length.toString().padStart(2, '0') + merchantCity);

  // Additional Data Field Template (62)
  const additionalData = `05${description.length.toString().padStart(2, '0')}${description}`;
  payload.push('62' + additionalData.length.toString().padStart(2, '0') + additionalData);

  // Montar payload completo
  const fullPayload = payload.join('');

  // CRC16 (63)
  const crc = calculateCRC16(fullPayload + '6304');
  payload.push('63' + '04' + crc);

  return payload.join('');
}

/**
 * Calcula CRC16-CCITT para PIX
 */
function calculateCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Valida chave PIX
 */
export function validatePixKey(key: string): boolean {
  // Email
  if (key.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
  }

  // CPF (11 dígitos)
  if (/^\d{11}$/.test(key)) {
    return true;
  }

  // CNPJ (14 dígitos)
  if (/^\d{14}$/.test(key)) {
    return true;
  }

  // Telefone (+5511999999999)
  if (/^\+55\d{10,11}$/.test(key)) {
    return true;
  }

  // Chave aleatória (UUID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) {
    return true;
  }

  return false;
}

