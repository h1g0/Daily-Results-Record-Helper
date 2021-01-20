<template>
  <li class="schedule-item" :id="schedule.id">
    <input
      type="time"
      v-model="schedule.start"
      @change="$emit('change-start-time')"
      v-bind:disabled="!isTopItem"
      autocomplete="on"
      title="開始時刻"
    /> -
    <input
      type="time"
      v-model="schedule.end"
      @change="$emit('change-end-time')"
      autocomplete="on"
      title="終了時刻"
    />
    <input
      type="button"
      @click="$emit('insert-now-time')"
      class="menu"
      value="⌚"
      title="現在時刻を挿入（5分刻み）"
    />
    <select v-model="schedule.category">
      <option v-for="category in categorylist" v-bind:key="category">{{ category }}</option>
    </select>
    <input
      type="text"
      v-model="schedule.text"
      @change="$emit('save-item')"
      autocomplete="on"
      title="内容"
    />
    <input type="text" v-model="schedule.duration" disabled="disabled" size="5" title="経過時間" />
    <input type="button" @click="$emit('add-item')" class="menu" value="➕" title="下に項目を追加" />
    <input
      type="button"
      @click="$emit('copy-item')"
      class="menu"
      value="📋"
      title="この内容をコピーして項目を追加"
    />
    <input
      type="button"
      @click="$emit('move-up-item')"
      class="menu"
      value="🔼"
      title="この内容を上に移動"
      v-visible="!this.isTopItem"
    />
    <input
      type="button"
      @click="$emit('move-down-item')"
      class="menu"
      value="🔽"
      title="この内容を下に移動"
      v-visible="!this.isBottomItem"
    />
    <input
      type="button"
      @click="$emit('delete-item')"
      class="menu"
      value="❌"
      title="この項目を削除"
      v-visible="this.isDeletableItem"
    />
  </li>
</template>

<script>
export default {
  name: "ScheduleItem",
  props: ["schedule", "index", "totalsize", "categorylist"],
  directives: {
    visible: {
      update: function(el, binding) {
        el.style.visibility = binding.value ? "visible" : "hidden";
      }
    }
  },
  data: function() {
    return {
      isTopItem: true,
      isBottomItem: true,
      isDeletableItem: false
    };
  },
  methods: {
    setItemState: function() {
      if (this.index == 0) {
        this.isTopItem = true;
      } else {
        this.isTopItem = false;
      }
      if (this.index == this.totalsize - 1) {
        this.isBottomItem = true;
      } else {
        this.isBottomItem = false;
      }
      if (this.totalsize > 1) {
        this.isDeletableItem = true;
      } else {
        this.isDeletableItem = false;
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
