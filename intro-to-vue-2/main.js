/*
    ------------------------------------------------------------------
    "data: {}" => retorna os mesmos dados
    "data() { return { ... } }" => retorna sempre novos dados
    ------------------------------------------------------------------
    Para passar dados entre componentes deve-se usar props
*/

/*
  Como a lista de reviews está no "avô" e não no "pai",
  para conseguir acessar através de um componente "neto"
  precisa definir um EventBus, do contrário dará ero.
  Após a definição do EventBus, precisa trocar os métodos
  "this.$emit(...)" para "eventBus.$emit(...)" e atribuir em "mounted".

  Obs.: essa não é a melhor forma de se comunicar entre componentes.
  A melhor maneira é usando controle de estado com Vuex.
*/
var eventBus = new Vue();

Vue.component('product', {
    props: {
        premium: {
            type: Boolean,
            required: true
        }
    },
    template: `
        <div class="product">
            <div class="product-image">
                <img :src="image" alt="Product image" />
            </div>

            <div class="product-info">
                <h1>{{ title }}</h1>
                <p v-if="inStock">In stock</p>
                <!-- <p v-else-if="inventory <= 10 && inventory > 0">Almost sold out</p> -->
                <p v-else>Out of stock</p>

                <!--
                  <p>Shipping: {{shipping}}</p>

                  <ul>
                      <li v-for="(detail, index) in details">
                          {{detail}}
                      </li>
                  </ul>
                -->
                <info-tabs :shipping="shipping" :details="details"></info-tabs>

                <div class="color-box"
                    v-for="(variant, index) in variants" :key="variant.variantId"
                    :style="{ backgroundColor: variant.variantColor }"
                    @mouseover="updateProduct(index)">
                </div>

                <button @click="addToCart"
                    :disabled="!inStock"
                    :class="{ disabledButton: !inStock }">Add to cart</button>

                <button @click="removeItem">Remove from cart</button>
            </div>

            <!--
              Como a lista de reviews está no "avô" e não no "pai",
              para conseguir acessar através de um componente "neto"
              precisa definir um EventBus, do contrário dará ero.

              <product-tabs @reviews="reviews"></product-tabs>
            -->
            <product-tabs :reviews="reviews"></product-tabs>

        </div>
    `,
    data() {
        return {
            product: 'Socks',
            brand: 'Vue Mastery',
            selectedVariant: 0,
            /* inventory: 100, */
            details: [
                "80% cotton",
                "20% polyester",
                "Genter-natural"
            ],
            variants: [
                {
                    variantId: 2234,
                    variantColor: "green",
                    variantImage: './assets/vmSocks-green-onWhite.jpg',
                    variantQuantity: 10
                },
                {
                    variantId: 2235,
                    variantColor: "blue",
                    variantImage: './assets/vmSocks-blue-onWhite.jpg',
                    variantQuantity: 0
                }
            ],
            reviews: []
        }
    },
    methods: {
        addToCart() {
            this.$emit('add-to-cart', this.variants[this.selectedVariant].variantId);
        },
        removeItem() {
            this.$emit('remove-from-cart', this.variants[this.selectedVariant].variantId);
        },
        updateProduct(index) {
            this.selectedVariant = index;
        },
        // Com eventBus, não precisa mais disso...
        // addReview(productReview) {
        //   this.reviews.push(productReview);
        // }
    },
    computed: {
        title() {
            return this.brand + ' ' + this.product;
        },
        image() {
            return this.variants[this.selectedVariant].variantImage;
        },
        inStock() {
            return this.variants[this.selectedVariant].variantQuantity;
        },
        shipping() {
            return this.premium ? "Free" : 2.99;
        }
    },
    mounted() {
      // Why the ES6 Syntax?
      // We’re using the ES6 arrow function syntax here because
      // an arrow function is bound to its parent’s context.
      // In other words, when we say this inside the function,
      // it refers to this component/instance.
      // You can write this code without an arrow function,
      // you’ll just have to manually bind the component’s this to
      // that function, like so:
      // -----------------------------------------------------------
      // eventBus.$on('review-submitted', function (productReview) {
      //   this.reviews.push(productReview)
      // }.bind(this))
      // -----------------------------------------------------------
      eventBus.$on('review-submitted', productReview => {
        this.reviews.push(productReview);
      })
    }
})

Vue.component('product-review', {
  template: `
    <form class="review-form" @submit.prevent="onSubmit">
      <p v-if="errors.length">
        <b>Please correct the following error(s):</b>
        <ul>
          <li v-for="error in errors">{{error}}</li>
        </ul>
      </p>

      <p>
        <label for="name">Name:</label>
        <input id="name" v-model="name">
      </p>

      <p>
        <label for="review">Review:</label>
        <!--
          Com "required" ele emitirá uma mensagem de acordo com o
          idioma do sistema informando que o campo é obrigatório.
          <textarea id="name" v-model="review" required></textarea>
        -->
        <textarea id="name" v-model="review"></textarea>
      </p>

      <p>
        <label for="rating">Rating:</label>
        <select id="rating" v-model.number="rating">
          <!--
            Outra forma de se gerar um sequencial interessante:
            https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#sequence_generator_range
          -->
          <option v-for="opt in 5">{{opt}}</option>
        </select>
      </p>

      <button type="submit">Submit</button>
    </form>
  `,
  data() {
    return {
      name: null,
      review: null,
      rating: null,
      errors: []
    }
  },
  methods: {
    onSubmit() {
      this.errors = [];

      if (this.name && this.review && this.rating) {
        let productReview = {
          name: this.name,
          review: this.review,
          rating: this.rating
        };

        // Sem eventBus
        // this.$emit('review-submitted', productReview);
        // Com eventBus
        eventBus.$emit('review-submitted', productReview);

        this.name = null;
        this.review = null;
        this.rating = null;
      }
      else {
        if (!this.name) this.errors.push("Name required");
        if (!this.review) this.errors.push("Review required");
        if (!this.rating) this.errors.push("Rating required");
      }
    }
  }
})

Vue.component('product-tabs', {
  props: {
    reviews: {
      type: Array,
      required: false
    }
  },
  template: `
    <div>
      <div>
        <span class="tabs"
          :class="{ activeTab: selectedTab === tab }"
          v-for="tab in tabs"
          :key="tab"
          @click="selectedTab = tab">
          {{tab}}
        </span>
      </div>

      <div v-show="selectedTab === 'Reviews'">
        <h2>Reviews</h2>
        <p v-if="!reviews.length">There are no reviews yet.</p>
        <ul v-else>
          <li v-for="(review, index) in reviews" :key="index">
            <p>{{ review.name }}</p>
            <p>Rating: {{ review.rating }}</p>
            <p>{{ review.review }}</p>
          </li>
        </ul>
      </div>

      <!--
        Com eventBus, não precisa mais disso..

        <product-review
          @review-submitted="addReview"
          v-show="selectedTab === 'Make a review'">
        </product-review>
      -->

      <div v-show="selectedTab === 'Make a review'">
        <product-review></product-review>
      </div>
    </div>
  `,
  data() {
    return {
      tabs: ['Reviews', 'Make a review'],
      selectedTab: 'Reviews'
    }
  }
})

Vue.component('info-tabs', {
  props: {
    shipping: {
      required: true
    },
    details: {
      type: Array,
      required: true
    }
  },
  template: `
    <div>
      <div>
        <span class="tabs"
          :class="{ activeTab: selectedTab === tab }"
          v-for="(tab, index) in tabs"
          :key="tab"
          @click="selectedTab = tab">
          {{tab}}
        </span>
      </div>

      <div v-show="selectedTab === 'Shipping'">
        <p>{{shipping}}</p>
      </div>

      <div v-show="selectedTab === 'Details'">
        <ul>
          <li v-for="(detail, index) in details">
              {{detail}}
          </li>
        </ul>
      </div>
    </div>
  `,
  data() {
    return {
      tabs: ['Shipping', 'Details'],
      selectedTab: 'Shipping'
    }
  }
})

var app = new Vue({
    el: '#app',
    data: {
        premium: true,
        cart: []
    },
    methods: {
        updateCart(id) {
            this.cart.push(id);
        },
        removeItem(id) {
            for (var i = 0; i <= this.cart.length; i++) {
                if (this.cart[i] == id) {
                    this.cart.splice(i, 1);
                    break;
                }
            }
        }
    }
})
