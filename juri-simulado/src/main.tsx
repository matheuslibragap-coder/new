import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const raiz = createRoot(document.getElementById("root")!);

// O import dinâmico garante que um erro de validação dos JSONs apareça na tela.
import("./App")
  .then(({ default: App }) =>
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((e: Error) =>
    raiz.render(
      <pre style={{ whiteSpace: "pre-wrap", padding: 16, color: "#b91c1c" }}>
        {"Erro nos dados (caso.json / macetes.json):\n\n" + e.message}
      </pre>,
    ),
  );
