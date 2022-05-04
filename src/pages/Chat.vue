<template>
  <div>
    <div class="chat-wrapper">
      <div class="left">
        <div class="top">
          <div class="top-left">
            <img alt="头像" :src="currentUser.avatar"/>
            <div class="username">{{ currentUser.username }}</div>

          </div>
          <div class="logout" @click="logout">注销</div>
        </div>
        <div class="bottom">

          <div class="list-one"
               v-for="user in QuserList"
               :key="user.id"
               :v-if="user.id!==currentUser.id"
               :class="user.id===targetUser.id?'selected':''"
               @click="selectTargetUser(user)">
            <img :src="user.avatar"/>
            <div class="username-content">
              <div class="username">{{ user.username }}</div>
              <div class="content">{{ user.latestMessage }}</div>
            </div>
            <div class="new-message" v-show="user.newMessage">新消息</div>
          </div>
        </div>
      </div>
      <div class="right">
        <div class="top">
          {{ targetUser ? targetUser.username : '请选择聊天对象' }}
        </div>
        <div class="center" id="center">
          <div class="load-more" @click="loadMore">
            <i class="fa fa-caret-up"></i>
            {{ hasNextPage ? '点击加载历史记录' : '已加载所有聊天记录' }}
          </div>

          <div class="message" v-for="(message,index) in messageList" :key="index"
               :class="currentUser.id==message.fromUser.id?'m-right':'m-left'">
            <img alt="头像" :src="message.fromUser.avatar"/>
            <div class="text">{{ message.message }}</div>
          </div>
        </div>
        <div class="bottom">
          <label>
            <textarea v-model="text"/>
          </label>
          <div class="option-list">
            <span class="tip">{{ getFontNumber }}</span>
            <div @click="send" class="submit">发送</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapActions, mapState} from "vuex";
import {selectMessageByUserIdAndPage} from "@/api";

export default {
  name: "Chat",
  data() {
    return {
      heartbeat:null,
      text: "",
      socket: "",
      messageList: [],
      userList: [],
      QuserList: [],
      targetUser: "",
      pageNum: 1,
      pageSize: 10,
      hasNextPage: true
    }
  },
  //头像列表  {id: '用户id', username: '用户名', latestMessage: '最近的一条消息', newMessage: '新消息', "avatar": "头像"}
//   json字符串 {isSystem: "为true标识系统消息, ", message: "聊天内容" ,fromUser: {"id": "用户id","avatar": "头像"}}
  methods: {
    ...mapActions(["resetCurrentUser"]),
    async loadMore() {
      if (!this.hasNextPage || !this.targetUser) {
        return;
      }
      this.pageNum++;
      let result = await selectMessageByUserIdAndPage({
        fromUserId: this.currentUser.id,
        toUserId: this.targetUser.id,
        pageNum: this.pageNum,
        pageSize: this.pageSize
      });

      console.log("-----",result)
      if (result.length>0) {
        // this.messageList.unshift(...result);
        for(let r of result){
          this.messageList.unshift(r);
        }
      }
      if (result.length<this.pageSize){
        this.hasNextPage = false;
      }
    },
    logout() {
      this.resetCurrentUser();
      this.socket.close();
      this.$router.replace('/login');
    },

    async selectTargetUser(user) {
      this.messageList = []

      this.pageNum = 1;
      this.targetUser = user;
      this.hasNextPage = true;
      user.newMessage = false;

      let result = await selectMessageByUserIdAndPage({
        fromUserId: this.currentUser.id,
        toUserId: user.id,
        pageNum: this.pageNum,
        pageSize: this.pageSize
      });


      console.log(result)
      for(let r of result){
        this.messageList.unshift(r);
      }

      this.scrollToBottom();
    },
    send() {
      if (!this.targetUser) {
        this.$message.warning("请选择聊天对象");
        return;
      }
      if (!this.text) {
        this.$message({type: 'warning', message: "请输入内容"})
        return;
      }
      if (typeof (WebSocket) == "undefined") {
        this.$message.error("您的浏览器不支持WebSocket");
        return;
      }

      ///////// CHANGE 发送到后台 后台转发给所有其他人
      let message_to_public = {
        type: "chatUserToPublic",
        fromUserId: this.currentUser.id,
        text: this.text,
        id:1,
      }
      this.socket.send(JSON.stringify((message_to_public)))
      this.messageList.push({
        message:this.text,
        fromUser:this.currentUser
      })
      this.updateLatestMessage()
      this.text='';
      this.scrollToBottom()
      ///////// CHANGE

      // 组装待发送的消息 json
      let message = {
        type: "chatUserToUser",
        fromUserId: this.currentUser.id,
        toUserId: this.targetUser.id,
        text: this.text
      }

      // 将组装好的json发送给服务端，由服务端进行转发
      this.socket.send(JSON.stringify(message));

      // 构建消息内容，本人消息
      this.messageList.push({
        message: this.text,
        fromUser: this.currentUser
      });
      //更新最新消息
      this.updateLatestMessage(message);
      // 重置文本
      this.text = '';
      //滚轮到最底部
      this.scrollToBottom();
    },

    updateLatestMessage(message) {
      let targetId;
      let latestMessage;
      let f = false;
      //当前用户为发送者
      if (message.fromUserId === this.currentUser.id) {
        targetId = message.toUserId;
        latestMessage = message.message;
      } else {
        //当前用户为接收者
        targetId = message.fromUserId;
        // latestMessage = JSON.parse(message.message).message;
        latestMessage = message.text;
        if (message.fromUserId !== this.targetUser.id) {
          f = true;
        }
      }
      for (let u of this.userList) {
        if (u.id === targetId) {
          u.latestMessage = latestMessage;
          u.newMessage = f;
          break;
        }
      }
    },
    scrollToBottom() {
      this.$nextTick(function () {
        let center = document.getElementById("center");
        center.scrollTop = center.scrollHeight - center.clientTop;
      });
    },

    async userOnline(user) {
      console.log('用户上线:',user)
      user.newMessage = false
      this.QuserList.push(user)
    },

    async userOffline(user) {
      console.log('用户下线:',user)
      let newUserList = [];
      for (let val of this.QuserList) {
        if(val.id == user.id){
          continue
        }
        newUserList.push(val)
      }
      this.QuserList = newUserList
    },

    async onGroupMessage(msg) {
      this.showMessage(msg)
      this.scrollToBottom()
    },

    ///////// CHANGE 收到广播消息
    async onUserMessageToPublic(msg) {
      console.log('收到用户发来的消息, 广播到公共',msg)

      this.showMessage(msg)
      this.scrollToBottom()
    },
    ///////// CHANGE 收到广播消息


    async onUserMessage(msg) {
      console.log('收到用户发来的消息:',msg)


      if(this.targetUser.id == msg.fromUserId){
        this.messageList.push({
          message: msg.text,
          fromUser: this.targetUser
        });
      }else{
        this.showMessage(msg)
      }

      this.scrollToBottom();
    },

    async showMessage(msg){

      let tmp = []

      for(let u of this.QuserList){
        // 显示
        if (u.id == msg.fromUserId){
          u.newMessage = true
        }
        tmp.push(u)
      }
      this.QuserList = tmp
    },
    async hideMessage(msg){
      for(let u of this.QuserList){
        // 显示
        if (u.id == msg.fromUserId){
          u.newMessage = true
        }
      }
    },
    async addUserList(users) {

      for (let i = 0; i < users.length; i++) {
        if (users[i].id==this.currentUser.id){
          continue
        }
        this.QuserList.push(users[i])

      }
    },
    onopen() {
      //打开事件
      this.socket.onopen = function () {
        console.log("websocket已打开");
      };

      if(!this.heartbeat){
        this.heartbeat = setInterval(() => {
          let msg = {
            type: "heartbeat"
          }
          this.socket.send(JSON.stringify(msg) )
        }, 10000);
      }
    },


    onmessage() {
      let _this = this;
      //  浏览器端收消息，获得从服务端发送过来的文本消息
      this.socket.onmessage = function (message) {
        // 对收到的json数据进行解析
        var data = JSON.parse(message.data)
        console.log('收到ws消息:',data)

        switch (data.type) {
          case 'heartbeat':
            break;
          case 'onlineUsers':
            _this.addUserList(data.data);
            break;
          case 'userOnline':
            _this.userOnline(data.data);
            break;
          case 'userOffline':
            _this.userOffline(data.data);
            break;
          case 'noreply':
            break;
          case 'chatUserToUser':
            _this.onUserMessage(data)
            break;


            ///////// CHANGE 收到广播消息
          case 'chatUserToPublic':
            _this.onUserMessageToPublic(data)
            break;
            ///////// CHANGE 收到广播消息

          default:
            break;
        }


      };
    },
    onclose() {
      //关闭事件
      this.socket.onclose = function () {
        console.log("websocket已关闭");
      };
    },
    onerror() {
      //发生了错误事件
      this.socket.onerror = function () {
        console.log("websocket发生了错误");
      }
    },
    init: function () {
      if (typeof (WebSocket) == "undefined") {
        this.$message.error("您的浏览器不支持WebSocket")
        return;
      }
      // WebSocket Server in gin g
      let socketUrl = "ws://localhost:8888/ws/" + this.currentUser.id;
      if (this.socket !== "" && this.socket !== null) {
        this.socket.close();
        this.socket = null;
      }
      // 开启一个websocket服务
      this.socket = new WebSocket(socketUrl);
      //打开连接
      this.onopen();
      //接收消息
      this.onmessage();
      //关闭连接
      this.onclose();
      //发生错误
      this.onerror();
    }

  },

  computed: {
    ...mapState(["currentUser"]),
    getFontNumber() {
      return this.text.length + "/500";
    }
  },
  watch: {
    text: {
      handler(newValue, oldValue) {
        if (newValue.length >= 500) {
          this.text = oldValue;
          this.$message.warning("超出字数限制！");
        }
      }
    }
  },
  mounted() {
    this.init();
  },
  destroyed() {
    //关闭socket连接
    this.socket.close();
    clearInterval(this.heartbeat)
  }
}
</script>

<style scoped lang="less">
.chat-wrapper {
  width: 1200px;
  // width: 500px;
  height: 650px;
  display: flex;
  background-color: white;

  .left {
    width: 20%;
    height: 100%;
    display: flex;
    flex-flow: column;
    box-sizing: border-box;
    border-right: 1px solid rgba(245, 245, 245);


    .top {
      height: 75px;
      width: 100%;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(245, 245, 245);
      box-sizing: border-box;


      .top-left {
        height: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;

        img {
          object-fit: cover;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          overflow: hidden;
        }

        .username {
          margin-left: 10px;
          font-size: 18px;
          max-width: 115px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }
      }

      .logout {
        padding: 2px 5px;
        margin-left: 10px;
        font-size: 14px;
        background-color: rgba(228, 229, 230);
        color: white;
        cursor: pointer;
      }

    }


    .bottom {
      height: 545px;
      width: 100%;
      overflow: auto;

      .list-one {
        padding: 10px 10px;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(245, 245, 245);
        display: flex;
        cursor: pointer;
        position: relative;

        &:hover {
          background-color: rgba(228, 229, 230);
        }

        &:hover .new-message {
          display: none;
        }

        &:last-child {
          border: none;
        }

        img {
          object-fit: cover;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          overflow: hidden;
        }

        .username-content {
          display: flex;
          flex-flow: column;
          justify-content: center;
          font-size: 12px;
          margin-left: 5px;

          .username {
            font-size: 14px;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            max-width: 145px;
          }

          .content {
            color: rgba(153, 153, 153);
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 1;
            overflow: hidden;
            max-width: 145px;
          }

        }

        .new-message {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 10px;
          font-size: 12px;
          border-radius: 15px;
          padding: 1px 3px;
          background-color: rgba(208, 207, 209);
          color: white;
        }
      }


      .selected {
        background-color: rgba(228, 229, 230);
      }
    }
  }

  .right {
    width: 80%;
    height: 100%;

    .top {
      height: 75px;
      width: 100%;
      box-sizing: border-box;
      border-bottom: 1px solid rgba(245, 245, 245);
      text-align: center;
      line-height: 75px;
    }

    .center {
      height: 400px;
      overflow: hidden;
      overflow-y: auto;
      padding: 0 20px;

      .load-more {
        text-align: center;
        margin-top: 5px;
        padding: 3px 0;
        font-size: 13px;
        color: rgba(184, 184, 184);
        position: relative;
        cursor: pointer;

        i {
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
        }
      }

      .message {
        display: flex;
        margin: 15px 0;

        img {
          object-fit: cover;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
        }

        .text {
          max-width: 450px;
          padding: 3px 10px;
          display: flex;
          align-items: center;
          border-radius: 10px;
          color: white;
          word-break: break-all;
        }

      }

      .m-left {
        .text {
          margin-left: 10px;
          background-color: rgba(0, 191, 255);
        }
      }

      .m-right {
        justify-content: flex-start;
        flex-flow: row-reverse;

        .text {
          margin-right: 10px;
          background-color: rgba(34, 139, 34);
        }
      }
    }

    .bottom {
      height: 175px;
      box-sizing: border-box;
      border-top: 1px solid rgba(216, 216, 216);

      textarea {
        border: none;
        outline: none;
        resize: none;
        overflow: auto;
        width: 100%;
        height: 125px;
        padding: 10px;
        font-family: inherit;
      }

      .option-list {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding: 0 10px;

        .tip {
          font-size: 13px;
          margin-right: 10px;
          color: rgba(216, 216, 216);
        }

        .submit {
          width: 90px;
          height: 30px;
          text-align: center;
          line-height: 30px;
          background-color: rgba(0, 175, 237);
          box-sizing: border-box;
          border: 1px solid rgba(216, 216, 216);
          border-radius: 5px;
          font-size: 14px;
          margin-right: 5px;
          color: white;
          cursor: pointer;
        }

      }

    }
  }
}

/*默认滚动条样式*/
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track-piece {
  background-color: rgba(0, 0, 0, 0);
  -webkit-border-radius: 6px;
}

::-webkit-scrollbar-thumb:vertical {
  height: 2px;
  background-color: rgb(204, 204, 204);
  -webkit-border-radius: 6px;
}

::-webkit-scrollbar-thumb:horizontal {
  width: 5px;
  background-color: rgba(125, 125, 125, 0.7);
  -webkit-border-radius: 6px;
}
</style>
