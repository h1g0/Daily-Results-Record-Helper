function buildId(){
    return "xxxxx".replace(/x/g,
        function(){return (Math.random() * 16 | 0).toString(16)});
}

Vue.directive('visible', function(el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

Vue.component('schedule-item', {
  props: ['schedule','index','totalsize','categorylist'],
    template: `
  <li class="schedule-item" :id = "schedule.id">
  <input type="time" v-model="schedule.start" @change="$emit('change-start-time')" v-bind:disabled="!isTopItem" autocomplete="on" title = "開始時刻" /> - 
  <input type="time" v-model="schedule.end" @change = "$emit('change-end-time')" autocomplete="on" title = "終了時刻" /> 
  <input type="button" @click = "$emit('insert-now-time')" class="menu" value = "⌚" title = "現在時刻を挿入（5分刻み）" /> 
  <select v-model="schedule.category">
  <option v-for="category in categorylist" v-bind:key="category">
    {{ category }}
  </option>
</select>
  <input type="text" v-model = "schedule.text" @change = "$emit('save-item')" autocomplete="on" title = "内容" />
  <input type="text" v-model = "schedule.duration" disabled="disabled" size="5" title = "経過時間" />
  <input type = "button" @click="$emit('add-item')" class="menu" value= "➕" title ="下に項目を追加" />
  <input type = "button" @click="$emit('copy-item')" class="menu" value= "📋" title = "下に内容をコピーして項目を追加" />
  <input type = "button" @click="$emit('move-up-item')" class="menu" value= "🔼" title = "この内容を上に移動" v-visible="!isTopItem" />
  <input type = "button" @click="$emit('move-down-item')" class="menu" value= "🔽" title = "この内容を下に移動" v-visible="!isBottomItem" />
  <input type = "button" @click="$emit('delete-item')" class="menu" value= "❌" title = "この項目を削除" v-visible="isDeletableItem" />
  </li>
  `,
  data: function(){
    return {
        isTopItem: true,
        isBottomItem: true,
        isDeletableItem: false,
    }
  },
  methods:{
    setItemState: function(){
        if(this.index == 0){
            this.isTopItem = true;
        }else{
            this.isTopItem = false;
        }
        if(this.index == this.totalsize - 1){
            this.isBottomItem = true;
        }else{
            this.isBottomItem = false;
        }
        if(this.totalsize > 1){
            this.isDeletableItem = true;
        }else{
            this.isDeletableItem = false;
        }    
    }
  }
})

var vm = new Vue({
    el: '#main',
    data: {
        scheduleList: [
        {id: buildId(), start: '', end: '', duration: '', category:'', text: ''}
        ],
        outputStr: '',
        categoryStr: '',
        categoryList: ['業務','休憩','その他'],
        outputTemplate: {
            header: '## 今日の実績{br}{br}',
            body: '- {StartHour}:{StartMinutes} - {EndHour}:{EndMinutes} 【{Category}】{Text} [{DurationHour}h{DurationMinutes}m]{br}',
            footer: '{br}',
            summaryHeader: '### 工数サマリ{br}{br}',
            summaryBody: '- {Category}：{SummaryHour}h{SummaryMinutes}m{br}',
            summaryFooter: '{br}',
        },
        settings: {
            showSettings: false,
            isSummaryFirstInAllOutput: false,
        }
    },
    methods: {
        clearList: function () {
            if ( ! window.confirm('リストをクリアします。よろしいですか？')) { return; }
            this.scheduleList = [{ id: buildId(), start: '', end: '', duration: '', category:'', text: '' }];
        },
        saveTemplate: function () {
            if (!window.confirm('現在のリストをテンプレートとして保存します。よろしいですか？')) { return; }
            localStorage.scheduleListTemplate = JSON.stringify(this.scheduleList);
        },
        loadTemplate: function () {
            if (!window.confirm('テンプレートをロードして現在のリストを上書きします。よろしいですか？')) { return; }
            this.scheduleList = JSON.parse(localStorage.scheduleListTemplate);
        },
        addItem: function(index){
            this.scheduleList.splice(index+1, 0,
            {id: buildId(), start: this.scheduleList[index].end, end: '', duration: '', category:'', text: ''}
            );
        },
        copyItem: function(index){
            this.addItem(index);
            this.scheduleList[index+1].text = this.scheduleList[index].text;
        },
        replaceItem: function (upperIndex, lowerIndex) {
            var temp = this.scheduleList[lowerIndex];
            var upperItemStartTime = this.scheduleList[upperIndex].start;
            var upperItemDurationTime = this.scheduleList[upperIndex].duration;
            var lowerItemDurationTime = this.scheduleList[lowerIndex].duration;
            this.scheduleList.splice(lowerIndex,1,this.scheduleList[upperIndex]);
            this.scheduleList.splice(upperIndex, 1, temp);
            this.scheduleList[upperIndex].start = upperItemStartTime;
            if (upperItemStartTime != "" && lowerItemDurationTime != "") {
                this.scheduleList[upperIndex].duration = lowerItemDurationTime;
                var tempDate = this.convertTimeStrToDate(upperItemStartTime);
                var tempDurationTimeArr = lowerItemDurationTime.split(':');
                tempDate.setHours(tempDate.getHours() + parseInt(tempDurationTimeArr[0]),
                    tempDate.getMinutes() + parseInt(tempDurationTimeArr[1]));
                this.scheduleList[upperIndex].end = ("0" + tempDate.getHours().toString()).slice(-2) + ':' + ("0" + tempDate.getMinutes().toString()).slice(-2);
                this.scheduleList[lowerIndex].start = this.scheduleList[upperIndex].end;
                if (upperItemDurationTime != "") {
                    var tempDate = this.convertTimeStrToDate(this.scheduleList[lowerIndex].start);
                    var tempDurationTimeArr = upperItemDurationTime.split(':');
                    tempDate.setHours(tempDate.getHours() + parseInt(tempDurationTimeArr[0]),
                        tempDate.getMinutes() + parseInt(tempDurationTimeArr[1]));
                    this.scheduleList[lowerIndex].end = ("0" + tempDate.getHours().toString()).slice(-2) + ':' + ("0" + tempDate.getMinutes().toString()).slice(-2);
                }

            }
        },
        moveUpItem: function(index){
            if (this.$refs[index]['0'].isTopItem) { return; }
            this.replaceItem(index - 1, index);

        },
        moveDownItem: function(index){
            if(this.$refs[index]['0'].isBottomItem){return;}
            this.replaceItem(index, index+1);
        },
        deleteItem: function (index) {
            if (!window.confirm('アイテムを削除します。よろしいですか？')) { return; }
            if( ! this.$refs[index]['0'].isTopItem &&
                ! this.$refs[index]['0'].isBottomItem ){
                this.scheduleList[index + 1].start = this.scheduleList[index - 1].end;
                this.getDurationTime(index + 1);
            }
            this.scheduleList.splice(index,1);
        },
        setAllItemStates: function(){
            for(item in this.$refs){
                if(this.$refs[item]['0']!=null){
                    this.$refs[item]['0'].setItemState();
                }
            }
        },
        insertNowTime: function(index){
            var nowTime = new Date();
            var hour = nowTime.getHours();
            var min = nowTime.getMinutes();
            if(min % 5 >= 3){
                    min += 5;
                    if(min >= 60){
                        hour++;
                        hour %= 24;
                        min %= 60;
                    }
            }
            min -= min % 5;
            var hourStr = ("0" + hour.toString()).slice(-2);
            var minStr = ("0" + min.toString()).slice(-2);
            this.scheduleList[index].end = hourStr + ":" + minStr;
            this.onChangeEndTime(index);
        },
        convertTimeStrToDate: function (timeStr) {
            var nowTime = new Date();
            var result = new Date((nowTime.getFullYear()).toString() + '/' +
                (nowTime.getMonth() + 1).toString() + '/' +
                (nowTime.getDate()).toString() + ' ' +
                timeStr + ':00');
            return result;
        },
        getDurationTime: function (index) {
            if (this.scheduleList[index].start == '' ||
                this.scheduleList[index].end == '') { return; }
            startDate = this.convertTimeStrToDate(this.scheduleList[index].start);
            endDate = this.convertTimeStrToDate(this.scheduleList[index].end);
            if (startDate > endDate) {
                endDate.setDate(endDate.getDate() + 1);
            }
            duration = Math.floor((endDate - startDate) / 1000 / 60);
            durationHour = ("0" + (Math.floor(duration / 60)).toString()).slice(-2);
            durationMin = ("0" + (duration % 60).toString()).slice(-2);
            this.scheduleList[index].duration =
                durationHour.toString() + ":" + durationMin.toString();
        },
        onChangeStartTime(index) {
            this.getDurationTime(index);
            this.saveItem();
        },
        onChangeEndTime: function(index){
            if ( ! this.$refs[index]['0'].isBottomItem) {
                this.scheduleList[index + 1].start = this.scheduleList[index].end;
                this.getDurationTime(index + 1);
            }
            this.getDurationTime(index);
            this.saveItem();
        },
        replaceOutputStr: function (item, template) {
            startStrArray = this.scheduleList[item].start.split(':');
            endStrArray = this.scheduleList[item].end.split(':');
            durationStrArray = this.scheduleList[item].duration.split(':');
            lineStr = template
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
        outputResult: function(){
            this.outputStr = this.replaceOutputStr(0,this.outputTemplate.header);
            for (item in this.scheduleList) {
                this.outputStr += this.replaceOutputStr(item,this.outputTemplate.body);
            }
            this.outputStr += this.replaceOutputStr(0,this.outputTemplate.footer);

        },
        replaceOutputSummaryStr: function (categoryStr, summaryMinutes, template) {
            var durationMin = ('0'+ (summaryMinutes % 60).toString()).slice(-2);
            var durationHour = ('0'+ ((summaryMinutes - durationMin) / 60).toString()).slice(-2);
            lineStr = template
            .replace(/\{SummaryHour\}/g, durationHour)
            .replace(/\{SummaryMinutes\}/g, durationMin)
            .replace(/\{Category\}/g, categoryStr)
                .replace(/\{br\}/g, "\n");
            return lineStr;
        },
        outputSummaryResult: function () {
            var summaryDict = {};
            for (item in this.scheduleList) {
                summaryDict[this.scheduleList[item].category] = 0;
            }
            for (item in this.scheduleList) {
                if (this.scheduleList[item].duration != "") {
                    var durationStrArr = this.scheduleList[item].duration.split(':');
                    var durationMin = parseInt(durationStrArr[0]) * 60 + parseInt(durationStrArr[1]);
                    summaryDict[this.scheduleList[item].category] += durationMin;
                }
            }
            this.outputStr = this.replaceOutputSummaryStr('カテゴリ未設定', 0, this.outputTemplate.summaryHeader);
            for (item in summaryDict) {
                this.outputStr += this.replaceOutputSummaryStr(item, summaryDict[item], this.outputTemplate.summaryBody);
            }
            this.outputStr += this.replaceOutputSummaryStr('カテゴリ未設定', 0, this.outputTemplate.summaryFooter);
        },
        outputAllResult: function () {
            this.outputResult();
            var resultStr = this.outputStr;
            this.outputSummaryResult();
            var resultSummaryStr = this.outputStr;
            if (this.settings.isSummaryFirstInAllOutput) {
                this.outputStr = resultSummaryStr + resultStr;
            } else {
                this.outputStr = resultStr + resultSummaryStr;
            }
        },
        outputJSON: function(){
            this.outputStr = JSON.stringify(this.scheduleList);
        },
        copyResult: function(){
            var textarea = document.getElementsByTagName("textarea")[0];
            textarea.select();
            document.execCommand("copy");
        },
        saveItem: function(){
            localStorage.scheduleList = JSON.stringify(this.scheduleList);
        },
        onChangeOutputTemplate: function () {
            localStorage.outputTemplate = JSON.stringify(this.outputTemplate);
        },
        setCategoryStrToList: function () {
            this.categoryList = this.categoryStr.split('\n');
        },
        onChangeCategoryStr: function () {
            this.setCategoryStrToList();
            localStorage.categoryList = JSON.stringify(this.categoryList);
        },
        onChangeSettings: function () {
            localStorage.settings = JSON.stringify(this.settings);
        }
    },
    mounted(){
        if(localStorage.scheduleList){
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
        for (var i = 0; i < this.categoryList.length; i++){
            this.categoryStr += this.categoryList[i];
            if (i < this.categoryList.length - 1) {
                this.categoryStr += '\n';
            }
        }
    },
    updated: function () {
        this.$nextTick(function () {
          this.setAllItemStates();
        })
    },
    watch:{
        scheduleList(newList){
            this.saveItem();
        }
    }
});