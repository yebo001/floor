// import WxRequest from "./request";
import WxRequest from "mina-request";
import { getStorage, clearStorage } from "./storage";
import { modal, toast } from "./extendApi";

// 对 WxRequest 进行实例化
const instance = new WxRequest({
  baseURL: "https://gmall-prod.atguigu.cn/mall-api",
  timeout: 5000,
});

// 设置请求拦截器
instance.interceptors.request = (config) => {
  // 从本地获取 token
  const token = getStorage("token");

  if (token) {
    // 如果存在 token ，则添加请求头
    config.header["token"] = token;
  }

  // 返回请求参数
  return config;
};

// 设置响应拦截器
instance.interceptors.response = async (response) => {
  const { response: res, isSuccess } = response;

  // isSuccess: false 表示是网络超时或其他问题，提示 网络异常，同时将返回即可
  if (!isSuccess) {
    wx.toast("网络异常，请稍后重试~");
    // 如果请求错误，将错误的结果返回出去
    return res;
  }

  switch (res.data.code) {
    case 200:
      return res.data;

    case 208:
      // 判断用户是否点击了确定
      const modalStatus = await modal({
        title: "提示",
        content: "登录授权过期，请重新授权",
        showCancel: false,
      });

      // 如果点击了确定，先清空本地的 token，然后跳转到登录页面
      if (modalStatus) {
        clearStorage();
        wx.navigateTo({
          url: "/pages/login/login",
        });
      }
      return;

    default:
      wx.showToast({
        title: "接口调用失败~~~~",
        icon: "none",
      });

      // 将错误继续向下传递
      return Promise.reject(response);
  }
};

// 将 WxRequest 的实例通过模块化的方式暴露出去
export default instance;
