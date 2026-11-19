const handleLayoutNavigationClick = (
  event: MouseEvent,
  sectionId: string,
  onJump: (sectionId: string) => void
): void => {
  if (
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }
  event.preventDefault();
  onJump(sectionId);
};

export { handleLayoutNavigationClick };
