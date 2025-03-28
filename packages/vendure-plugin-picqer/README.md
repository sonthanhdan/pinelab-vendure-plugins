# Vendure Picqer Plugin

![Vendure version](https://img.shields.io/npm/dependency-version/vendure-plugin-picqer/dev/@vendure/core)

!! This plugin is still being developed and it's still incomplete!

Vendure plugin to sync orders, stock and catalogue with Picqer.com order pick platform.

- Sync placed orders to Picqer
- Sync all products to Picqer
- Pull stock levels from Picqer into Vendure

The plugin follows these principles:

- Vendure should be considered the source of truth for product presentation: Assets, descriptions and names are pushed from Vendure to Picqer
- Picqer should be considered the source of truth for stock levels: Stock levels are pulled from Picqer into Vendure

## Getting started

Add the plugin to your `vendure-config.ts`

```ts
// vendure-config.ts

import {PicqerPlugin} from 'vendure-plugin-picqer'

...
plugins: [
  PicqerPlugin.init({
    /**
     * Optional strategy to push additional fields to Picqer.
     * This example pushes variant.sku as product.barcode to Picqer
     */
    pushFieldsToPicqer: (variant) => ({ barcode: variant.sku })
  }),
  AdminUiPlugin.init({
    port: 3002,
    route: 'admin',
    app: compileUiExtensions({
      outputPath: path.join(__dirname, '__admin-ui'),
      extensions: [
        PicqerPlugin.ui,
        ... // your other plugin UI extensions
      ],
    }),
  }),
... // your other plugins
]

```

## Stock levels

Stock levels are updated in Vendure on

1. Full sync via the Admin UI
2. Or, on incoming webhook from Picqer

## Caveats

- Due to limitation of the Picqer API, the plugin only uploads images if no images exist for the product in Picqer.
- Stock is updated directly using the database layer, so no `ProductVariantEvents` or `StockMovementEvents` are emitted by Vendure when variants are updated in Vendure by the full sync.
