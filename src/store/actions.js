import {RESET_CURRENT_USER, SET_CURRENT_USER} from "@/store/mutation-types";

export default {

    // 清除当前用户信息
    resetCurrentUser(context) {
        context.commit(RESET_CURRENT_USER);
    },

    // 存储当前用户信息
    setCurrentUser(context, currentUser) {
        context.commit(SET_CURRENT_USER, currentUser);
    },
}
