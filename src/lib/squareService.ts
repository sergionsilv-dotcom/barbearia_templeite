export interface SquareCheckout {
  id: string;
  amount_money: { amount: number; currency: string };
  device_options: { device_id: string };
  status: 'PENDING' | 'IN_PROGRESS' | 'CANCEL_QUEUED' | 'CANCELLING' | 'COMPLETED' | 'CANCELLED';
  app_fee_money?: { amount: number; currency: string };
  tip_money?: { amount: number; currency: string }; // Valor da gorjeta capturado na máquina
}

export const squareService = {
  async createCheckout(params: { 
    amount: number; 
    deviceId: string; 
    locationId: string;
  }): Promise<SquareCheckout> {
    const response = await fetch('/.netlify/functions/create-square-checkout', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao iniciar pagamento na maquininha');
    }
    
    return response.json();
  },

  async getCheckoutStatus(id: string): Promise<SquareCheckout> {
    const response = await fetch(`/.netlify/functions/get-square-checkout?id=${id}`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar status do pagamento');
    }
    
    return response.json();
  },

  async waitForCompletion(id: string, onUpdate?: (status: string) => void): Promise<SquareCheckout> {
    const poll = async (): Promise<SquareCheckout> => {
      const checkout = await squareService.getCheckoutStatus(id);
      if (onUpdate) onUpdate(checkout.status);

      if (checkout.status === 'COMPLETED' || checkout.status === 'CANCELLED') {
        return checkout;
      }

      // Poll every 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      return poll();
    };

    return poll();
  },

  /**
   * Abre o Aplicativo da Square para pagamento via Leitor Bluetooth (Reader)
   * Suporta iOS (iPad) e Android (S24)
   */
  startMobileCheckout(params: {
    amount: number;
    applicationId: string;
    locationId: string;
    currencyCode?: string; // BRL, USD, CAD, etc.
    note?: string;
  }) {
    const currency = params.currencyCode || 'BRL';
    
    // Guard: ID vazio
    if (!params.applicationId) {
      alert("ERRO: Square Application ID está vazio. Acesse Configurações e salve o ID de PRODUÇÃO do Square Developer Portal.");
      return;
    }

    // 1. Verificação de Sandbox (Não funciona no App do Tablet)
    if (params.applicationId.startsWith('sandbox-')) {
      alert(`ERRO: Você está usando chaves de 'SANDBOX'. O aplicativo da Square no iPad/Celular só aceita chaves de 'PRODUÇÃO'.`);
      return;
    }

    const callbackUrl = window.location.origin + window.location.pathname;
    const amountCents = Math.round(params.amount * 100);
    
    // JSON de configuração para a Square (iOS e fallback)
    const checkoutData = {
      amount_money: {
        amount: amountCents.toString(),
        currency_code: currency
      },
      callback_url: callbackUrl,
      client_id: params.applicationId,
      version: "1.3",
      notes: params.note || "Pagamento Barbeiro",
      options: {
        supported_tender_types: ["CREDIT_CARD", "DEBIT_CARD", "CASH"]
      }
    };

    const dataString = encodeURIComponent(JSON.stringify(checkoutData));
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Android Intent - Formato recomendado pela Square
      const intentUrl = [
        "intent:#Intent",
        "action=com.squareup.pos.action.CHARGE",
        "package=com.squareup",
        `S.com.squareup.pos.WEB_CALLBACK_URI=${encodeURIComponent(callbackUrl)}`,
        `S.com.squareup.pos.CLIENT_ID=${params.applicationId}`,
        `S.com.squareup.pos.API_VERSION=v1.3`,
        `i.com.squareup.pos.TOTAL_AMOUNT=${amountCents}`,
        `S.com.squareup.pos.CURRENCY_CODE=${currency}`,
        `S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD,com.squareup.pos.TENDER_CASH`,
        `S.com.squareup.pos.NOTES=${encodeURIComponent(params.note || "Venda")}`,
        "end"
      ].join(";");
      
      window.location.href = intentUrl;
    } else {
      // iOS utiliza o esquema square-commerce-v1
      window.location.href = `square-commerce-v1://payment/create?data=${dataString}`;
    }
    
    // Fallback: Se o app não abrir, sugerir instalação
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        if (confirm("Se o aplicativo da Square não abriu, verifique se está instalado e se as chaves de PRODUÇÃO estão corretas.")) {
          window.location.href = isAndroid 
            ? "https://play.google.com/store/apps/details?id=com.squareup"
            : "https://apps.apple.com/app/square-point-of-sale/id335393788";
        }
      }
    }, 3500);
  }
};
