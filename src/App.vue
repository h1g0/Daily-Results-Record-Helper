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
