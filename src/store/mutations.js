import {RESET_CURRENT_USER, SET_CURRENT_USER} from "@/store/mutation-types";
import {TOKEN} from "@/api/ajax";
import {WOLF_CHAT_CURRENT_USER} from "@/common";

export default {
    /**
     * 清除当前用户信息
     * @param state
     */
    [RESET_CURRENT_USER](state) {
        localStorage.removeItem(TOKEN);
        localStorage.removeItem(WOLF_CHAT_CURRENT_USER);
        state.currentUser = null;
    },

    /**
     * 更新当前用户信息
     * @param state
     * @param currentUser
     */
    [SET_CURRENT_USER](state, currentUser) {
        //更新用户信息
        localStorage.setItem(WOLF_CHAT_CURRENT_USER, JSON.stringify(currentUser));
        state.currentUser = currentUser;
    },

}
