const routes = require('../utils/routes');

/** VERIFY product card testids and naming against the live /products catalog. */
class ProductCatalogPage {
  constructor(page) {
    this.page = page;
    this.productCards = page.getByTestId('product-card');
    this.productCardByName = (name) => page.getByTestId('product-card').filter({ hasText: name });
  }

  async goto() {
    await this.page.goto(routes.PRODUCTS);
  }

  async openProduct(name) {
    await this.productCardByName(name).click();
  }
}

module.exports = { ProductCatalogPage };
