const pretty = (obj) => JSON.stringify(obj, null, 2);

async function callJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(pretty(data));
  }

  return data;
}

function setBusy(button, isBusy) {
  button.disabled = isBusy;
  button.dataset.originalText ||= button.textContent;
  button.textContent = isBusy ? "Выполняется..." : button.dataset.originalText;
}

function showResult(el, data, isError = false) {
  el.style.color = isError ? "#ffb1c8" : "#d7e3ff";
  el.textContent = typeof data === "string" ? data : pretty(data);
}

document.getElementById("upload-btn").addEventListener("click", async (e) => {
  const result = document.getElementById("upload-result");
  const fileInput = document.getElementById("upload-file");
  const file = fileInput.files?.[0];

  if (!file) {
    showResult(result, "Выберите PDF-файл перед отправкой.", true);
    return;
  }

  setBusy(e.target, true);
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(pretty(data));

    showResult(result, data);
  } catch (err) {
    showResult(result, err.message, true);
  } finally {
    setBusy(e.target, false);
  }
});

document.getElementById("chat-btn").addEventListener("click", async (e) => {
  const message = document.getElementById("chat-message").value.trim();
  const model = document.getElementById("chat-model").value.trim();
  const result = document.getElementById("chat-result");

  if (!message) {
    showResult(result, "Введите сообщение.", true);
    return;
  }

  setBusy(e.target, true);
  try {
    const data = await callJson("/chat", { message, model: model || undefined });
    showResult(result, data);
  } catch (err) {
    showResult(result, err.message, true);
  } finally {
    setBusy(e.target, false);
  }
});

document.getElementById("summarize-btn").addEventListener("click", async (e) => {
  const pdfPath = document.getElementById("summarize-path").value.trim();
  const result = document.getElementById("summarize-result");

  if (!pdfPath) {
    showResult(result, "Введите pdfPath.", true);
    return;
  }

  setBusy(e.target, true);
  try {
    const data = await callJson("/summarize", { pdfPath });
    showResult(result, data);
  } catch (err) {
    showResult(result, err.message, true);
  } finally {
    setBusy(e.target, false);
  }
});

document.getElementById("agents-btn").addEventListener("click", async (e) => {
  const topic = document.getElementById("agents-topic").value.trim();
  const turns = Number(document.getElementById("agents-turns").value || 3);
  const result = document.getElementById("agents-result");

  if (!topic) {
    showResult(result, "Введите topic.", true);
    return;
  }

  setBusy(e.target, true);
  try {
    const data = await callJson("/agents", { topic, turns });
    showResult(result, data);
  } catch (err) {
    showResult(result, err.message, true);
  } finally {
    setBusy(e.target, false);
  }
});

document.getElementById("reset-btn").addEventListener("click", async (e) => {
  const result = document.getElementById("reset-result");
  setBusy(e.target, true);
  try {
    const data = await callJson("/reset", {});
    showResult(result, data);
  } catch (err) {
    showResult(result, err.message, true);
  } finally {
    setBusy(e.target, false);
  }
});
