<template>
<div>
    <router-view/>
</div>
</template>

<script>

import {mapActions} from "vuex";
import {STATE, WOLF_CHAT_CURRENT_USER} from "@/common";
import {selectUserById} from "@/api";

export default {
    name: 'App',
    methods: {
        ...mapActions(["setCurrentUser", "resetCurrentUser"]),
        initState() {
            //在页面加载时读取sessionStorage里的状态信息
            let state = sessionStorage.getItem(STATE);
            if (state) {
                this.$store.replaceState(Object.assign(this.$store.state, JSON.parse(state)));
                sessionStorage.removeItem(STATE)
            }
            //在页面刷新时将vuex里的信息保存到sessionStorage里
            window.addEventListener('beforeunload', () => {
                sessionStorage.setItem(STATE, JSON.stringify(this.$store.state));
            });
        },
        async initCurrentUser() {
            let currentUser = JSON.parse(localStorage.getItem(WOLF_CHAT_CURRENT_USER));
            let result = {data: null};
            if (currentUser) {
                result = await selectUserById({userId: currentUser.id});
            }
            this.setCurrentUser(result.data);
        },
    },
    created() {
        this.initState();
        this.initCurrentUser();
    },
}
</script>

<style>

</style>
