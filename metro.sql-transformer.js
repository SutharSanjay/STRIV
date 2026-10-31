const upstream = require('@react-native/metro-babel-transformer');

function transform(args) {
  if (args.filename.endsWith('.sql')) {
    return upstream.transform({
      ...args,
      src: `export default ${JSON.stringify(args.src)};`,
    });
  }

  return upstream.transform(args);
}

module.exports = {
  ...upstream,
  transform,
};
