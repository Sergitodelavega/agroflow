import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useKKiaPay } from "kkiapay-react";
import type { IData, ILibrary } from "kkiapay";

/**
 * Web adapter around `kkiapay-react`.
 * The pasted doc (`kkiapay-react-sdk-doc.md`) is the React-Native SDK
 * (`@kkiapay-org/react-native-sdk` + WebView). That package cannot run in Vite.
 * This wrapper keeps the same surface: KkiapayProvider + useKkiapay +
 * openKkiapayWidget / addSuccessListener / addFailedListener / close.
 */
export interface KkiapayWidgetOptions {
  amount: number;
  api_key: string;
  sandbox: boolean;
  email?: string;
  phone?: string;
  name?: string;
  data?: string;
  partnerId?: string;
  theme?: string;
}

export interface KkiapayApi {
  ready: boolean;
  openKkiapayWidget: (options: KkiapayWidgetOptions) => void;
  closeKkiapayWidget: () => void;
  addSuccessListener: ILibrary["addSuccessListener"];
  addFailedListener: ILibrary["addFailedListener"];
  addKkiapayCloseListener: ILibrary["addKkiapayCloseListener"];
  removeKkiapayListener: ILibrary["removeKkiapayListener"];
}

const KkiapayContext = createContext<KkiapayApi | null>(null);

export function KkiapayProvider({ children }: { children: ReactNode }) {
  const sdk = useKKiaPay();
  const stubOpen = useRef(sdk.openKkiapayWidget);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sdk.openKkiapayWidget !== stubOpen.current) setReady(true);
  }, [sdk]);

  const value = useMemo<KkiapayApi>(
    () => ({
      ready,
      closeKkiapayWidget: sdk.closeKkiapayWidget,
      addSuccessListener: sdk.addSuccessListener,
      addFailedListener: sdk.addFailedListener,
      addKkiapayCloseListener: sdk.addKkiapayCloseListener,
      removeKkiapayListener: sdk.removeKkiapayListener,
      openKkiapayWidget: (options) => {
        const payload: IData = {
          amount: options.amount,
          api_key: options.api_key,
          key: options.api_key,
          sandbox: options.sandbox,
          email: options.email,
          phone: options.phone,
          name: options.name,
          data: options.data,
          partnerId: options.partnerId,
          theme: options.theme ?? "#0d0d0d",
        };
        sdk.openKkiapayWidget(payload);
      },
    }),
    [ready, sdk],
  );

  return <KkiapayContext.Provider value={value}>{children}</KkiapayContext.Provider>;
}

export function useKkiapay(): KkiapayApi {
  const ctx = useContext(KkiapayContext);
  if (!ctx) throw new Error("useKkiapay must be used within KkiapayProvider");
  return ctx;
}

export default KkiapayProvider;
