const activateEnhancedDocument = (doc: Document): void => {
  doc.body.classList.add("atv-enhanced");
};

const installEnhancedRoot = (
  doc: Document,
  renderRoot: (root: HTMLElement) => void
): boolean => {
  const root = doc.createElement("div");
  root.id = "atv-douban-root";

  try {
    renderRoot(root);
    doc.body.insertBefore(root, doc.body.firstChild);
  } catch (error) {
    root.remove();
    console.warn("[ATV-Douban] 页面挂载失败：", error);
    return false;
  }

  activateEnhancedDocument(doc);
  return true;
};

export { installEnhancedRoot };
