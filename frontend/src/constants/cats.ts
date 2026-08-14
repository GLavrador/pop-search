const modules = import.meta.glob<string>('../assets/cats/*.jpg', {
  eager: true,
  import: 'default',
});

export const CAT_IMAGES: string[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path]);

export const randomCat = (): string =>
  CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
