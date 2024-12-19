import instance from "../../utils/http";

Page({
  /**
   * 页面的初始数据
   */
  data: { avatarUrl: "../../assets/images/love.jpg" },

    handler() {
    // 获取当前帐号信息
    const accountInfo = wx.getAccountInfoSync();

    // 获取小程序项目的 appId
    console.log(accountInfo.miniProgram.appId);
    // 获取小程序 当前环境版本
    console.log(accountInfo.miniProgram.envVersion);

    // const res = await instance.get("/index/findBanner", null, {
    //   isLoading: true,
    // });
    // const res2 = await instance.get('/index/findBanner')
    // const res2 = await instance.get('/cart/getCartList')
    // console.log(res)

    // 使用 Promise.all 同时处理多个异步请求
    // const [res1, res2] = await instance.all([
    //   instance.get("/mall-api/index/findBanner"),
    //   instance.get("/mall-api/index/findCategory1"),
    // ]);

    // console.log(res1);
    // console.log(res2);
  },
  // 获取微信头像
  async chooseavatar(event) {
    // 目前获取的微信头像是临时路径
    // 临时路径是有失效时间的，在实际开发中，需要将临时路径上传到公司的服务器
    const { avatarUrl } = event.detail;

    // 调用  upload 方法发送请求，将临时路径上传到公司的服务器
    const res = await instance.upload("/fileUpload", avatarUrl, "file");

    // 将返回的数据赋值给 data 中的数据
    this.setData({
      avatarUrl: res.data,
      // avatarUrl,
    });
  },
});
