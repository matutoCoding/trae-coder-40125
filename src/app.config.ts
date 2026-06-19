export default defineAppConfig({
  pages: [
    'pages/seat/index',
    'pages/waiting/index',
    'pages/bill/index',
    'pages/mine/index',
    'pages/booking/index',
    'pages/rate/index',
    'pages/seat-admin/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2B7A68',
    navigationBarTitleText: '静读自习室',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F4F7F5'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#2B7A68',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/seat/index',
        text: '选座'
      },
      {
        pagePath: 'pages/waiting/index',
        text: '候补'
      },
      {
        pagePath: 'pages/bill/index',
        text: '账单'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
