<template>
  <div id="app">
    <h1>実績入力</h1>
    <schedule-list id="schedule"></schedule-list>
  </div>
</template>
<script>
import ScheduleList from "./components/ScheduleList.vue";
export default {
  name: "app",
  components: {
    ScheduleList,
  },
};
</script>
<style scoped>
h1 {
  font-size: 16px;
  padding: 0.3em 0.3em;
  color: #494949;
  background: #f4f4f4;
  border-left: solid 16px #7db4e6;
  border-bottom: solid 3px #d7d7d7;
}
</style>