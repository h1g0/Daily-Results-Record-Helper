import ScheduleItem from "../ScheduleItem.vue";
export default {
  name: "ScheduleList",
  components: {
    ScheduleItem,
  },
  directives: {
    visible: {
      update: function (el, binding) {
        el.style.visibility = binding.value ? "visible" : "hidden";
      },
    },
  },
  data: function () {
    return {
      scheduleList: [
        {
          id: this.buildId(),
          start: "",
          end: "",
          duration: "",
          category: "",
          text: "",
        },
      ],
      outputStr: "",
      categoryStr: "",
      categoryList: ["業務", "休憩", "その他"],
      outputTemplate: {
        header: "## 今日の実績{br}{br}",
        body:
          "- {StartHour}:{StartMinutes} - {EndHour}:{EndMinutes} 【{Category}】{Text} [{DurationHour}h{DurationMinutes}m]{br}",
        footer: "{br}",
        summaryHeader: "### 工数サマリ{br}{br}",
        summaryBody: "- {Category}：{SummaryHour}h{SummaryMinutes}m{br}",
        summaryFooter: "{br}",
      },
      settings: {
        showSettings: false,
        isSummaryFirstInAllOutput: false,
      },
    };
  },
  methods: {
    buildId: function () {
      return "xxxxx".replace(/x/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      });
    },
    buildNewItem: function () {
      return {
        id: this.buildId(),
        start: "",
        end: "",
        duration: "",
        category: "",
        text: "",
      };
    },
    clearList: function () {
      if (!window.confirm("リストをクリアします。よろしいですか？")) {
        return;
      }
      this.scheduleList = [this.buildNewItem];
    },
    saveTemplate: function () {
      if (
        !window.confirm(
          "現在のリストをテンプレートとして保存します。よろしいですか？"
        )
      ) {
        return;
      }
      localStorage.scheduleListTemplate = JSON.stringify(this.scheduleList);
    },
    loadTemplate: function () {
      if (
        !window.confirm(
          "テンプレートをロードして現在のリストを上書きします。よろしいですか？"
        )
      ) {
        return;
      }
      this.scheduleList = JSON.parse(localStorage.scheduleListTemplate);
    },
    addItem: function (index) {
      this.scheduleList.splice(
        index + 1,
        0,
        //{id: buildId(), start: this.scheduleList[index].end, end: '', duration: '', category:'', text: ''}
        this.buildNewItem()
      );
      this.scheduleList[index + 1].start = this.scheduleList[index].end;
    },
    copyItem: function (index) {
      this.addItem(index);
      this.scheduleList[index + 1].text = this.scheduleList[index].text;
    },
    replaceItem: function (upperIndex, lowerIndex) {
      let temp = this.scheduleList[lowerIndex];
      let upperItemStartTime = this.scheduleList[upperIndex].start;
      let upperItemDurationTime = this.scheduleList[upperIndex].duration;
      let lowerItemDurationTime = this.scheduleList[lowerIndex].duration;
      this.scheduleList.splice(lowerIndex, 1, this.scheduleList[upperIndex]);
      this.scheduleList.splice(upperIndex, 1, temp);
      this.scheduleList[upperIndex].start = upperItemStartTime;
      if (upperItemStartTime != "" && lowerItemDurationTime != "") {
        this.scheduleList[upperIndex].duration = lowerItemDurationTime;
        let tempDate = this.convertTimeStrToDate(upperItemStartTime);
        let tempDurationTimeArr = lowerItemDurationTime.split(":");
        tempDate.setHours(
          tempDate.getHours() + parseInt(tempDurationTimeArr[0]),
          tempDate.getMinutes() + parseInt(tempDurationTimeArr[1])
        );
        this.scheduleList[upperIndex].end =
          ("0" + tempDate.getHours().toString()).slice(-2) +
          ":" +
          ("0" + tempDate.getMinutes().toString()).slice(-2);
        this.scheduleList[lowerIndex].start = this.scheduleList[upperIndex].end;
        if (upperItemDurationTime != "") {
          tempDate = this.convertTimeStrToDate(
            this.scheduleList[lowerIndex].start
          );
          tempDurationTimeArr = upperItemDurationTime.split(":");
          tempDate.setHours(
            tempDate.getHours() + parseInt(tempDurationTimeArr[0]),
            tempDate.getMinutes() + parseInt(tempDurationTimeArr[1])
          );
          this.scheduleList[lowerIndex].end =
            ("0" + tempDate.getHours().toString()).slice(-2) +
            ":" +
            ("0" + tempDate.getMinutes().toString()).slice(-2);
        }
      }
    },
    moveUpItem: function (index) {
      if (this.$refs[index]["0"].isTopItem) {
        return;
      }
      this.replaceItem(index - 1, index);
    },
    moveDownItem: function (index) {
      if (this.$refs[index]["0"].isBottomItem) {
        return;
      }
      this.replaceItem(index, index + 1);
    },
    deleteItem: function (index) {
      if (!window.confirm("アイテムを削除します。よろしいですか？")) {
        return;
      }
      if (
        !this.$refs[index]["0"].isTopItem &&
        !this.$refs[index]["0"].isBottomItem
      ) {
        this.scheduleList[index + 1].start = this.scheduleList[index - 1].end;
        this.getDurationTime(index + 1);
      }
      this.scheduleList.splice(index, 1);
    },
    setAllItemStates: function () {
      for (let item in this.$refs) {
        if (this.$refs[item]["0"] != null) {
          this.$refs[item]["0"].setItemState();
        }
      }
    },
    insertNowTime: function (index) {
      let nowTime = new Date();
      let hour = nowTime.getHours();
      let min = nowTime.getMinutes();
      if (min % 5 >= 3) {
        min += 5;
        if (min >= 60) {
          hour++;
          hour %= 24;
          min %= 60;
        }
      }
      min -= min % 5;
      let hourStr = ("0" + hour.toString()).slice(-2);
      let minStr = ("0" + min.toString()).slice(-2);
      this.scheduleList[index].end = hourStr + ":" + minStr;
      this.onChangeEndTime(index);
    },
    convertTimeStrToDate: function (timeStr) {
      let nowTime = new Date();
      let result = new Date(
        nowTime.getFullYear().toString() +
          "/" +
          (nowTime.getMonth() + 1).toString() +
          "/" +
          nowTime.getDate().toString() +
          " " +
          timeStr +
          ":00"
      );
      return result;
    },
    getDurationTime: function (index) {
      if (
        this.scheduleList[index].start == "" ||
        this.scheduleList[index].end == ""
      ) {
        return;
      }
      let startDate = this.convertTimeStrToDate(this.scheduleList[index].start);
      let endDate = this.convertTimeStrToDate(this.scheduleList[index].end);
      if (startDate > endDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      let duration = Math.floor((endDate - startDate) / 1000 / 60);
      let durationHour = ("0" + Math.floor(duration / 60).toString()).slice(-2);
      let durationMin = ("0" + (duration % 60).toString()).slice(-2);
      this.scheduleList[index].duration =
        durationHour.toString() + ":" + durationMin.toString();
    },
    onChangeStartTime(index) {
      this.getDurationTime(index);
      this.saveItem();
    },
    onChangeEndTime: function (index) {
      if (!this.$refs[index]["0"].isBottomItem) {
        this.scheduleList[index + 1].start = this.scheduleList[index].end;
        this.getDurationTime(index + 1);
      }
      this.getDurationTime(index);
      this.saveItem();
    },
    replaceOutputStr: function (item, template) {
      let startStrArray = this.scheduleList[item].start.split(":");
      let endStrArray = this.scheduleList[item].end.split(":");
      let durationStrArray = this.scheduleList[item].duration.split(":");
      let lineStr = template
        .replace(/\{StartHour\}/g, startStrArray[0])
        .replace(/\{StartMinutes\}/g, startStrArray[1])
        .replace(/\{EndHour\}/g, endStrArray[0])
        .replace(/\{EndMinutes\}/g, endStrArray[1])
        .replace(/\{DurationHour\}/g, durationStrArray[0])
        .replace(/\{DurationMinutes\}/g, durationStrArray[1])
        .replace(/\{Category\}/g, this.scheduleList[item].category)
        .replace(/\{Text\}/g, this.scheduleList[item].text)
        .replace(/\{br\}/g, "\n");
      return lineStr;
    },
    outputResult: function () {
      this.outputStr = this.replaceOutputStr(0, this.outputTemplate.header);
      for (let item in this.scheduleList) {
        this.outputStr += this.replaceOutputStr(item, this.outputTemplate.body);
      }
      this.outputStr += this.replaceOutputStr(0, this.outputTemplate.footer);
    },
    replaceOutputSummaryStr: function (categoryStr, summaryMinutes, template) {
      let durationMin = ("0" + (summaryMinutes % 60).toString()).slice(-2);
      let durationHour = (
        "0" + ((summaryMinutes - durationMin) / 60).toString()
      ).slice(-2);
      let lineStr = template
        .replace(/\{SummaryHour\}/g, durationHour)
        .replace(/\{SummaryMinutes\}/g, durationMin)
        .replace(/\{Category\}/g, categoryStr)
        .replace(/\{br\}/g, "\n");
      return lineStr;
    },
    outputSummaryResult: function () {
      let summaryDict = {};
      for (let item in this.scheduleList) {
        summaryDict[this.scheduleList[item].category] = 0;
      }
      for (let item in this.scheduleList) {
        if (this.scheduleList[item].duration != "") {
          let durationStrArr = this.scheduleList[item].duration.split(":");
          let durationMin =
            parseInt(durationStrArr[0]) * 60 + parseInt(durationStrArr[1]);
          summaryDict[this.scheduleList[item].category] += durationMin;
        }
      }
      this.outputStr = this.replaceOutputSummaryStr(
        "カテゴリ未設定",
        0,
        this.outputTemplate.summaryHeader
      );
      for (let item in summaryDict) {
        this.outputStr += this.replaceOutputSummaryStr(
          item,
          summaryDict[item],
          this.outputTemplate.summaryBody
        );
      }
      this.outputStr += this.replaceOutputSummaryStr(
        "カテゴリ未設定",
        0,
        this.outputTemplate.summaryFooter
      );
    },
    outputAllResult: function () {
      this.outputResult();
      let resultStr = this.outputStr;
      this.outputSummaryResult();
      let resultSummaryStr = this.outputStr;
      if (this.settings.isSummaryFirstInAllOutput) {
        this.outputStr = resultSummaryStr + resultStr;
      } else {
        this.outputStr = resultStr + resultSummaryStr;
      }
    },
    outputJSON: function () {
      this.outputStr = JSON.stringify(this.scheduleList);
    },
    copyResult: function () {
      let textarea = document.getElementsByTagName("textarea")[0];
      textarea.select();
      document.execCommand("copy");
    },
    saveItem: function () {
      localStorage.scheduleList = JSON.stringify(this.scheduleList);
    },
    onChangeOutputTemplate: function () {
      localStorage.outputTemplate = JSON.stringify(this.outputTemplate);
    },
    setCategoryStrToList: function () {
      this.categoryList = this.categoryStr.split("\n");
    },
    onChangeCategoryStr: function () {
      this.setCategoryStrToList();
      localStorage.categoryList = JSON.stringify(this.categoryList);
    },
    onChangeSettings: function () {
      localStorage.settings = JSON.stringify(this.settings);
    },
  },
  mounted() {
    if (localStorage.scheduleList) {
      this.scheduleList = JSON.parse(localStorage.scheduleList);
    }
    if (localStorage.outputTemplate) {
      this.outputTemplate = JSON.parse(localStorage.outputTemplate);
    }
    if (localStorage.categoryList) {
      this.categoryList = JSON.parse(localStorage.categoryList);
    }
    if (localStorage.settings) {
      this.settings = JSON.parse(localStorage.settings);
    }
    this.categoryStr = "";
    for (let i = 0; i < this.categoryList.length; i++) {
      this.categoryStr += this.categoryList[i];
      if (i < this.categoryList.length - 1) {
        this.categoryStr += "\n";
      }
    }
  },
  updated: function () {
    this.$nextTick(function () {
      this.setAllItemStates();
    });
  },
  watch: {
    scheduleList() {
      this.saveItem();
    },
  },
};
