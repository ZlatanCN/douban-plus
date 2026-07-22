import { Fragment, createContext } from "preact";
import type { ComponentChildren } from "preact";
import { useContext, useLayoutEffect, useState } from "preact/hooks";

const ModalSessionContext = createContext(0);

type ModalSessionProps = {
  children: ComponentChildren;
  request: object;
};

const ModalSession = ({ children, request }: ModalSessionProps) => {
  const [session, setSession] = useState({ request, sequence: 0 });
  useLayoutEffect(() => {
    setSession((current) =>
      current.request === request
        ? current
        : { request, sequence: current.sequence + 1 }
    );
  }, [request]);
  return (
    <ModalSessionContext.Provider value={session.sequence}>
      {children}
    </ModalSessionContext.Provider>
  );
};

const useModalSession = (): number => useContext(ModalSessionContext);

const ModalSessionContent = ({
  children,
}: Pick<ModalSessionProps, "children">) => (
  <Fragment key={useModalSession()}>{children}</Fragment>
);

export { ModalSession, ModalSessionContent, useModalSession };
export type { ModalSessionProps };
