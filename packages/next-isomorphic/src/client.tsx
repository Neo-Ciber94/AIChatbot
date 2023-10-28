"use client";

import React, {
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { type IsomorphicStore } from "./server";
import { setCookie } from ".";

const isomorphicStoreContext = createContext<{
  store: IsomorphicStore;
  setStore: (store: SetStateAction<IsomorphicStore>) => void;
}>({
  store: {
    prefix: "",
    state: {},
  },
  setStore: () => {},
});

type IsomorphicStoreProviderProps = {
  store: IsomorphicStore;
  children: React.ReactNode;
};

/**
 * Initializes the isomorphic context to share state between client and server.
 */
export function IsomorphicStoreProvider({
  children,
  ...rest
}: IsomorphicStoreProviderProps) {
  const [store, setStore] = useState(rest.store);

  return (
    <isomorphicStoreContext.Provider value={{ store, setStore }}>
      {children}
    </isomorphicStoreContext.Provider>
  );
}

/**
 * Options to create a isomorphic client store.
 */
type CreateIsomorphicClientOptions<S extends IsomorphicStore> = {
  /**
   * Called each time the store state changes on the client.
   * @param newState The new state.
   */
  onChange?: (changes: { newState: S["state"]; prevState: S["state"] }) => void;
};

type CreateIsomorphicClient<S extends IsomorphicStore> = {
  [K in keyof S["state"]]: {
    useValue: () => [
      S["state"][K],
      (newValue: SetStateAction<S["state"][K]>) => void,
    ];
  };
};

/**
 * Creates a client to consume an isomorphic store.
 * @param options Options to pass to the store.
 */
export function createIsomorphicClient<S extends IsomorphicStore>(
  options?: CreateIsomorphicClientOptions<S>,
): CreateIsomorphicClient<S> {
  const { onChange } = options || {};

  function createUseValueHook<K extends keyof S["state"]>(name: K) {
    type TValue = S["state"][K];
    type TKey = keyof typeof store.state;

    const { store, setStore } = useContext(isomorphicStoreContext);

    const setValue = useCallback(
      (newValue: SetStateAction<TValue>) => {
        const prevValue = store.state[name as TKey] as S["state"];
        const value =
          newValue instanceof Function
            ? newValue(prevValue as TValue)
            : newValue;

        setStore((prev) => {
          const newState = {
            ...prev.state,
            [name]: value,
          };

          if (onChange) {
            onChange({
              newState: { ...newState },
              prevState: { ...prevValue },
            });
          }

          return {
            ...prev,
            state: newState,
          };
        });

        const cookieName = `${store.prefix}/${String(name)}`;
        setCookie(cookieName, JSON.stringify(value));
      },

      [name, setStore, store.prefix, store.state],
    );

    const value = useMemo(() => {
      const key = name as TKey;
      return store.state[key]!;
    }, [name, store]);

    // prettier-ignore
    return [value, setValue] as [TValue, (newValue: SetStateAction<TValue>) => void];
  }

  return new Proxy({} as CreateIsomorphicClient<S>, {
    get(_, key) {
      return {
        /**
         * Returns a consumer that updates a value in the isomorphic store.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useValue: createUseValueHook(key as any),
      };
    },
  });
}
