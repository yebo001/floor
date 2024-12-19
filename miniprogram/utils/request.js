// 创建 WxRequest 类，采用类的方式进行封装会让方法更具有复用性，也可以方便进行添加新的属性和方法
class WxRequest {
  // 定义实例属性，用来设置默认请求参数
  defaults = {
    baseURL: "", // 请求基准地址
    url: "", // 接口的请求路径
    data: null, // 请求参数
    method: "GET", // 默认的请求方法
    // 请求头
    header: {
      "Content-type": "application/json", // 设置数据的交互格式
    },
    timeout: 60000, // 默认的超时时长，小程序默认的超时时长是 1 分钟
    isLoading: true, // 是否显示 loading 提示框
  };

  // 定义拦截器对象，包含请求拦截器和响应拦截器方法，方便在请求或响应之前进行处理。
  interceptors = {
    // 请求拦截器
    request: (config) => config,
    // 响应拦截器
    response: (response) => response,
  };

  // 用于创建和初始化类的属性以及方法
  // 在实例化时传入的参数，会被 constructor 形参进行接收
  constructor(params = {}) {
    // 通过 Object.assign 方法合并请求参数
    // 注意：需要传入的参数，覆盖默认的参数，因此传入的参数需要放到最后
    this.defaults = Object.assign({}, this.defaults, params);
    // 初始化 queue 数组，用于存储请求队列
    this.queue = [];
  }

  // request 实例方法接收一个对象类型的参数
  // 属性值和 wx.request 方法调用时传递的参数保持一致
  request(options) {
    // 如果有新的请求，则清空上一次的定时器
    this.timerId && clearTimeout(this.timerId);

    // 注意：需要先合并完整的请求地址 (baseURL + url)
    // https://gmall-prod.atguigu.cn/mall-api/index/findBanner
    options.url = this.defaults.baseURL + options.url;

    // 合并请求参数
    options = { ...this.defaults, ...options };

    // 发送请求之前添加 loding
    if (options.isLoading && options.method !== "UPLOAD") {
      this.queue.length === 0 && wx.showLoading();
      // 然后想队列中添加 request 标识，代表需要发送一次新请求
      this.queue.push("request");
    }

    // 在发送请求之前调用请求拦截器
    options = this.interceptors.request(options);

    // 使用 Promise 封装异步请求
    return new Promise((resolve, reject) => {
      if (options.method === "UPLOAD") {
        wx.uploadFile({
          ...options,

          success: (res) => {
            // 将服务器响应的数据通过 JSON.parse 转换为 JS 对象
            res.data = JSON.parse(res.data);

            const mergeRes = Object.assign({}, res, {
              config: options,
              isSuccess: true,
            });

            resolve(this.interceptors.response(mergeRes));
          },

          fail: (err) => {
            const mergeErr = Object.assign({}, err, {
              config: options,
              isSuccess: false,
            });
            console.log("执行到了错误的方法里面");
            reject(this.interceptors.response(mergeErr));
          },

          // complete: () => {
          //   this.queue.pop();

          //   this.queue.length === 0 && wx.hideLoading();
          // },
        });
      } else {
        // 使用 wx.request 发起请求
        wx.request({
          ...options,

          // 接口调用成功的回调函数
          success: (res) => {
            // 响应成功以后触发响应拦截器
            if (this.interceptors.response) {
              // 调用响应拦截器方法，获取到响应拦截器内部返回数据
              // success: true 表示服务器成功响应了结果，我们需要对业务状态码进行判断
              res = this.interceptors.response({
                response: res,
                isSuccess: true,
              });
            }

            // 将数据通过 resolve 进行返回即可
            resolve(res);
          },

          // 接口调用失败的回调函数
          fail: (err) => {
            // 响应失败以后也要执行响应拦截器
            if (this.interceptors.response) {
              // isSuccess: false 表示是网络超时或其他问题
              err = this.interceptors.response({
                response: err,
                isSuccess: true,
              });
            }

            // 当请求失败以后，通过 reject 返回错误原因
            reject(err);
          },
          complete: () => {
            if (!options.isLoading) return;

            // 每次请求结束后，从队列中删除一个请求标识
            this.queue.pop();

            // 如果队列已经清空，在往队列中添加一个标识
            this.queue.length === 0 && this.queue.push("request");

            // 等所有的任务执行完以后，经过 100 毫秒
            // 将最后一个 request 清除，然后隐藏 loading
            this.timerId = setTimeout(() => {
              this.queue.pop();
              this.queue.length === 0 && wx.hideLoading();
            }, 100);
          },
        });
      }
    });
  }

  // 封装 GET 实例方法
  get(url, data = {}, config = {}) {
    // 需要调用 request 请求方法发送请求，只需要组织好参数，传递给 request 请求方法即可
    // 当调用 get 方法时，需要将 request 方法的返回值 return 出去
    return this.request(Object.assign({ url, data, method: "GET" }, config));
  }

  // 封装 DELETE 实例方法
  delete(url, data = {}, config = {}) {
    return this.request(Object.assign({ url, data, method: "DELETE" }, config));
  }

  // 封装 POST 实例方法
  post(url, data = {}, config = {}) {
    return this.request(Object.assign({ url, data, method: "POST" }, config));
  }

  // 封装 PUT 实例方法
  put(url, data = {}, config = {}) {
    return this.request(Object.assign({ url, data, method: "PUT" }, config));
  }

  // 封装处理并发请求的 all 方法
  all(...promise) {
    return Promise.all(promise);
  }

  upload(url, filePath, name, config = {}) {
    return this.request(
      Object.assign({ url, filePath, name, method: "UPLOAD" }, config)
    );
  }
}

export default WxRequest;
