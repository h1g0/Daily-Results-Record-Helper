function buildId(){
    return "xxxxx".replace(/x/g,
        function(){return (Math.random() * 16 | 0).toString(16)});
}

Vue.directive('visible', function(el, binding) {
    el.style.visibility = !!binding.value ? 'visible' : 'hidden';
});

Vue.component('schedule-item', {
  props: ['schedule','index','totalsize'],
  template: `
  <li :id = "schedule.id">
  <input type="time" v-model="schedule.start" v-bind:disabled="!isTopItem" title = "開始時刻" /> - 
  <input type="time" v-model="schedule.end" @change = "$emit('change-end-time')" title = "終了時刻" /> 
  <input type="button" @click = "$emit('insert-now-time')" class="menu" value = "⌚" title = "現在時刻を挿入（5分刻み）" /> 
  <input type="text" v-model = "schedule.text" @change = "$emit('save-item')" title = "内容" />
  <!-- <item type="time" readonly="readonly" title = "経過時間" /> -->
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
            this.isTopItem = true
        }else{
            this.isTopItem = false
        }
        if(this.index == this.totalsize - 1){
            this.isBottomItem = true
        }else{
            this.isBottomItem = false
        }
        if(this.totalsize > 1){
            this.isDeletableItem = true
        }else{
            this.isDeletableItem = false
        }    
    }
  }
})

var vm = new Vue({
    el: '#plan',
    data: {
      scheduleList: [
        {id: buildId(), start: '', end: '', duration: '', text: ''}
      ],
        outputStr: '',
      
    },
    methods: {
        clearList: function () {
            if ( ! window.confirm('リストをクリアします。よろしいですか？')) { return; }
            this.scheduleList = [{ id: buildId(), start: '', end: '', duration: '', text: '' }];
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
            {id: buildId(), start: this.scheduleList[index].end, end: '', text: ''}
            );
        },
        copyItem: function(index){
            this.addItem(index);
            this.scheduleList[index+1].text = this.scheduleList[index].text;
        },
        moveUpItem: function(index){
            if(this.$refs[index]['0'].isTopItem){return;}
            var tempTxt = this.scheduleList[index].text;
            this.scheduleList[index].text = this.scheduleList[index-1].text;
            this.scheduleList[index-1].text = tempTxt;
        },
        moveDownItem: function(index){
            if(this.$refs[index]['0'].isBottomItem){return;}
            var tempTxt = this.scheduleList[index].text;
            this.scheduleList[index].text = this.scheduleList[index+1].text;
            this.scheduleList[index+1].text = tempTxt;
        },
        deleteItem: function (index) {
            if (!window.confirm('アイテムを削除します。よろしいですか？')) { return; }
            if( ! this.$refs[index]['0'].isTopItem &&
                ! this.$refs[index]['0'].isBottomItem ){
                this.scheduleList[index+1].start = this.scheduleList[index-1].end;
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
            var nowTime = new Date;
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
        onChangeEndTime: function(index){
            this.saveItem();
            if(this.$refs[index]['0'].isBottomItem){return;}
            this.scheduleList[index+1].start = this.scheduleList[index].end;
        },
        outputResult: function(){
            this.outputStr = "";
            for(item in this.scheduleList){
                this.outputStr += "- " + this.scheduleList[item].start +
                             " - " + this.scheduleList[item].end + " " +
                             this.scheduleList[item].text + "\n";
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
        }
    },
    mounted(){
        if(localStorage.scheduleList){
            this.scheduleList = JSON.parse(localStorage.scheduleList);
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