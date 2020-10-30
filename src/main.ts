import Vue from 'vue'
import VueRx from 'vue-rx'
import App from './App.vue'
import TableView from 'virtual-table-vue'
import GridSplitter from 'grid-splitter-vue'
import DialogBox from 'dialogbox-vue'
import { getSelectAll } from './directives'

Vue.config.productionTip = false

Vue.use(VueRx)
Vue.use(TableView)
Vue.use(GridSplitter)
Vue.use(DialogBox)

Vue.directive('selectall', getSelectAll())

new Vue({
  render: h => h(App),
}).$mount('#app')
