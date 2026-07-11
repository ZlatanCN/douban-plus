import ultracite from "ultracite/stylelint";

export default {
  ...ultracite,
  rules: {
    ...ultracite.rules,
    "property-no-vendor-prefix": null,
  },
};
