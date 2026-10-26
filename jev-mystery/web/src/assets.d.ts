// Bun's bundler copies an imported image next to the bundle and hands back
// its address.
declare module "*.png" {
  const url: string;
  export default url;
}
