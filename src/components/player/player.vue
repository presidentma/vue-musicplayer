<template>
<div class="player" v-show="playList.length > 0">
  <transition name="normal" @enter="enter"
  @after-enter="afterEnter" @leave="leave"
  @after-leave="afterLeave" >
  <div class="normal-player" v-show="fullScreen">
    <div class="background">
      <img width="100%" height="100%" :src="currentSong.image">
    </div>
    <div class="top">
      <div class="back" @click="back">
        <i class="icon-back"></i>
      </div>
      <h1 class="title" v-html="currentSong.name"></h1>
      <h2 class="subtitle" v-html="currentSong.singer"></h2>
    </div>
    <div class="middle" @touchstart.prevent="middleTouchStart"
    @touchmove.prevent="middleTouchMove"
    @touchend.prevent="middleTouchEnd">
      <div class="middle-l" ref="middleL">
        <div class="cd-wrapper" ref="cdWrapper">
          <div class="cd" :class="cdRotate">
            <img class="image" :src="currentSong.image">
          </div>
        </div>
        <div class="play-lyric-wrapper">
          <div class="play-lyric">{{playingLyric}}</div>
        </div>
      </div>
      <Scroll class="middle-r" ref="lyricList" :data="currentLyric && currentLyric.lines">
        <div class="lyric-wrapper">
          <div v-if="currentLyric">
            <p ref="lyricLine" class="text"
            :class="{'current': currentLineNumber === index}"
            v-for="(line, index) in currentLyric.lines">{{line.txt}}</p>
          </div>
        </div>
      </Scroll>
    </div>
    <div class="bottom">
      <div class="dot-wrapper">
        <span class="dot" :class="{'active': currentShow === 'cd'}"> </span>
        <span class="dot" :class="{'active': currentShow === 'lyric'}"> </span>
      </div>
      <div class="progress-wrapper">
        <span class="time time-l">{{format(currentTime)}}</span>
        <div class="progress-bar-wrapper">
          <progressBar :percent="percent" @percentChange="onPercentChange"></progressBar>
        </div>
        <span class="time time-r">{{format(currentSong.duration)}}</span>
      </div>
      <div class="operators">
        <div class="icon i-left" @click.prevent="changePlayMode">
          <i :class="iconMode"></i>
        </div>
        <div class="icon i-left" :class="disable">
          <i class="icon-prev" @click="prev"></i>
        </div>
        <div class="icon i-center" :class="disable">
          <i :class="playIcon" @click="togglePlaying"></i>
        </div>
        <div class="icon i-right" :class="disable">
          <i class="icon-next" @click="next"></i>
        </div>
        <div class="icon i-right">
          <i class="icon icon-not-favorite"></i>
        </div>
      </div>
    </div>
  </div>
  </transition>
  <transition name="mini">
  <div class="mini-player" v-show="!fullScreen" @click="expand">
    <div class="icon">
      <img :class="cdRotate" width="40" height="40" :src="currentSong.image">
    </div>
    <div class="text">
      <h2 class="name" v-html="currentSong.name"></h2>
      <p class="desc" v-html="currentSong.singer"></p>
    </div>
    <div class="control">
      <progressCircle :percent="percent">
      <i :class="miniIcon" class="icon-mini" @click.stop="togglePlaying"></i>
      </progressCircle>
    </div>
    <div class="control">
      <i class="icon-playlist"></i>
    </div>
  </div>
  </transition>
  <audio ref="audio" :src="currentSong.url" @canplay="ready" @timeupdate="updateTime" 
  @error="error" @ended="end"></audio>
</div>
</template>

<script type="text/ecmascript-6">
import {mapGetters, mapMutations} from 'vuex'
import animations from 'create-keyframe-animation'
import {prefixStyle} from 'common/js/dom'
import progressBar from '@/base/progress-bar/progress-bar'
import progressCircle from '@/base/progress-circle/progress-circle'
import {playMode} from '@/common/js/config'
import {shuffle} from '@/common/js/util'
import Lyric from 'lyric-parser'
import Scroll from '@/base/scroll/scroll'

const transform = prefixStyle('transform')
const transitionDuration = prefixStyle('transitionDuration')
const slideDurationTime = 300
export default {
  data() {
    return {
      songReady: false,
      currentTime: 0,
      currentLineNumber: 0,
      currentLyric: null,
      currentShow: 'cd',
      playingLyric: null
    }
  },
  created() {
    this.touch = {}
  },
  computed: {
    ...mapGetters([
      'fullScreen',
      'playList',
      'currentSong',
      'playing',
      'currentIndex',
      'mode',
      'sequenceList'
    ]),
    playIcon() {
      return this.playing ? 'icon-pause' : 'icon-play'
    },
    miniIcon() {
      return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
    },
    cdRotate() {
      return this.playing ? 'play' : 'play pause'
    },
    disable() {
      return this.songReady ? '' : 'disable'
    },
    percent() {
      return this.currentTime / this.currentSong.duration
    },
    iconMode() {
      return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random'
    }
  },
  methods: {
    back() {
      this.setFullScreen(false)
    },
    expand() {
      this.setFullScreen(true)
    },
    enter(el, done) {
      const {X, Y, scale} = this._getPosAndScale()
      let animation = {
        0: {
          transform: `translate3d(${X}px, ${Y}px, 0) scale(${scale})`
        },
        60: {
          transform: `translate3d(0, 0, 0) scale(1.1)`
        },
        100: {
          transform: `translate3d(0, 0, 0) scale(1)`
        }
      }
      animations.registerAnimation({
        name: 'move',
        animation,
        presets: {
          duration: 500,
          easing: 'linear'
        }
      })
      animations.runAnimation(this.$refs.cdWrapper, 'move', done)
    },
    afterEnter() {
      animations.unregisterAnimation('move')
      this.$refs.cdWrapper.style.animation = ''
    },
    leave(el, done) {
      this.$refs.cdWrapper.style.transition = 'all 0.5s'
      const {X, Y, scale} = this._getPosAndScale()
      this.$refs.cdWrapper.style[transform] = `translate3d(${X}px, ${Y}px, 0) scale(${scale})`
      this.$refs.cdWrapper.addEventListener('transitionend', done)
    },
    afterLeave() {
      this.$refs.cdWrapper.style.transition = ''
      this.$refs.cdWrapper.style[transform] = ''
    },
    _getPosAndScale() {
      const targetWidth = 40
      const paddingLeft = 40
      const paddingBottom = 30
      const paddingTop = 80
      const cdWidth = window.innerWidth * 0.8
      const scale = targetWidth / cdWidth
      const X = -(window.innerWidth / 2 - paddingLeft)
      const Y = window.innerHeight - paddingTop - cdWidth / 2 - paddingBottom
      return {
        X,
        Y,
        scale
      }
    },
    togglePlaying() {
      if (!this.songReady) {
        return
      }
      this.setPlayingState(!this.playing)
      if (this.currentLyric) {
        this.currentLyric.togglePlay()
      }
    },
    middleTouchStart(e) {
      this.touch.initiated = true
      const touch = e.touches[0]
      this.touch.startX = touch.pageX
      this.touch.startY = touch.pageY
    },
    middleTouchMove(e) {
      if (!this.touch.initiated) {
        return
      }
      const touch = e.touches[0]
      const deltaX = touch.pageX - this.touch.startX
      const deltaY = touch.pageY - this.touch.startY
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return
      }
      const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
      const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
      this.touch.percent = Math.abs(offsetWidth / window.innerWidth)
      let opacity = 1 - this.touch.percent
      this._slidePlayer(offsetWidth, 'move', opacity)
    },
    middleTouchEnd() {
      let offsetWidth
      let opacity
      if (this.currentShow === 'cd') {
        if (this.touch.percent > 0.1) {
          offsetWidth = -window.innerWidth
          this.currentShow = 'lyric'
          opacity = 0
        } else {
          offsetWidth = 0
          opacity = 1
        }
      } else {
        if (this.touch.percent < 0.9) {
          offsetWidth = 0
          this.currentShow = 'cd'
          opacity = 1
        } else {
          offsetWidth = -window.innerWidth
          opacity = 0
        }
      }
      this._slidePlayer(offsetWidth, 'end', opacity)
    },
    _slidePlayer(offsetWidth, type, opacity) {
      this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px,0 , 0)`
      this.$refs.middleL.style.opacity = opacity
      if (type === 'end') {
        this.$refs.lyricList.$el.style[transitionDuration] = `${slideDurationTime}ms`
        this.$refs.middleL.style[transitionDuration] = `${slideDurationTime}ms`
      } else {
        this.$refs.lyricList.$el.style[transitionDuration] = '0s'
        this.$refs.middleL.style[transitionDuration] = '0s'
      }
    },
    prev() {
      if (!this.songReady) {
        return
      }
      if (this.playList.length === 1) {
        this.loop()
      } else {
        let index = this.currentIndex - 1
        if (index === -1) {
          index = this.playList.length - 1
        }
        this.setCurrentIndex(index)
        if (!this.playing) {
          this.togglePlaying()
        }
      }
      this.songReady = false
    },
    next() {
      if (!this.songReady) {
        return
      }
      if (this.playList.length === 1) {
        this.loop()
      } else {
        let index = this.currentIndex + 1
        if (index === this.playList.length) {
          index = 0
        }
        this.setCurrentIndex(index)
        if (!this.playing) {
          this.togglePlaying()
        }
      }

      this.songReady = false
    },
    end() {
      if (this.mode === playMode.loop) {
        this.loop()
      } else {
        this.next()
      }
    },
    loop() {
      this.$refs.audio.currentTime = 0
      this.$refs.audio.play()
      if (this.currentLyric) {
        this.currentLyric.seek(0)
      }
    },
    ready() {
      this.songReady = true
    },
    error() {
      this.songReady = true
    },
    updateTime(e) {
      this.currentTime = e.target.currentTime
    },
    format(interval) {
      interval = interval | 0
      const minutes = this._pad(interval / 60 | 0)
      const second = this._pad(interval % 60)
      let hours = (interval / 3600 | 0)
      if (hours) {
        hours = this._pad(hours)
        return `${hours}:${minutes}:${second}`
      }
      // 有部分音频会超出小时
      return `${minutes}:${second}`
    },
    _pad(num, n = 2) {
      // 补位
      let len = num.toString().length
      while (len < n) {
        num = `0${num}`
        len++
      }
      return num
    },
    onPercentChange(newPercent) {
      const currentTime = newPercent * this.currentSong.duration
      this.$refs.audio.currentTime = currentTime
      if (!this.playing) {
        this.togglePlaying()
      }
      if (this.currentLyric) {
        this.currentLyric.seek(currentTime * 1000)
      }
    },
    changePlayMode() {
      const mode = (this.mode + 1) % 3
      this.setPlayMode(mode)
      let list = null
      if (mode === playMode.random) {
        list = shuffle(this.sequenceList)
      } else {
        list = this.sequenceList
      }
      this.resetCurrentIndex(list)
      this.setPlayList(list)
    },
    resetCurrentIndex(list) {
      let index = list.findIndex((item) => {
        return item.id === this.currentSong.id
      })
      this.setCurrentIndex(index)
    },
    getLyric() {
      this.currentSong.getLyric().then((lyric) => {
        this.currentLyric = new Lyric(lyric, this.handleLyric)
        if (this.playing) {
          this.currentLyric.play()
        }
      }).catch(() => {
        this.currentLyric = null
        this.playingLyric = ''
        this.currentLineNum = 0
      })
    },
    handleLyric({lineNum, txt}) {
      this.currentLineNumber = lineNum
      if (lineNum > 5) {
        let lineEl = this.$refs.lyricLine[lineNum - 5]
        this.$refs.lyricList.scrollToElement(lineEl, 1000)
      } else {
        this.$refs.lyricList.scrollTo(0, 0, 1000)
      }
      this.playingLyric = txt
    },
    ...mapMutations({
      setFullScreen: 'SET_FULLSCREEN',
      setPlayingState: 'SET_PLAYING',
      setCurrentIndex: 'SET_CURRENT_INDEX',
      setPlayMode: 'SET_PLAY_MODE',
      setPlayList: 'SET_PLAYLIST'
    })
  },
  watch: {
    currentSong(newSong, oldSong) {
      if (newSong.id === oldSong.id) {
        return
      }
      if (this.currentLyric) {
        this.currentLyric.stop()
      }
      setTimeout(() => {
        this.$refs.audio.play()
        this.getLyric()
      }, 1000)
    },
    playing(newPlaying) {
      const audio = this.$refs.audio
      setTimeout(() => {
        newPlaying ? audio.play() : audio.pause()
      }, 20)
    }
  },
  components: {
    progressBar,
    progressCircle,
    Scroll
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
@import '../../common/stylus/variables'
@import '../../common/stylus/mixin'

.player
  .normal-player
    position fixed
    top 0
    left 0
    right 0
    bottom 0
    z-index 150
    background $color-background-full
    .background
      position absolute
      left 0
      top 0
      width 100%
      height 100%
      z-index -1
      opacity 0.9
      filter blur(20px)
    .top
      position relative
      margin-bottom 25px
      .back
        position absolute
        top 0
        left 6px
        z-index 50
        .icon-back
          display block
          padding 9px
          font-size $font-size-large-x
          color $color-icon-white
          transform rotate(-90deg)
      .title
        width 70%
        margin 0 auto
        line-height 40px
        text-align center
        font-weight bold
        no-warp()
        font-size $font-size-large
        color $color-text-ll
      .subtitle
        line-height 20px
        text-align center
        font-size $font-size-medium
        color $color-text-ll 
    .middle
      position fixed
      width 100%
      top 80px
      bottom 170px
      white-space nowrap
      font-size 0
      .middle-l
        display inline-block
        vertical-align top
        position relative
        width 100%
        height 0
        padding-top 80%
        .cd-wrapper
          position absolute
          left 10%
          top 0
          width 80%
          height 100%
          .cd
            width 100%
            height 100%
            box-sizing border-box
            border 10px solid rgba(153,153,153,0.1)
            border-radius 50%
            &.play
              animation rotate 20s linear infinite
            &.pause
              animation-play-state paused
            .image
              position absolute
              left 0
              top 0
              width 100%
              height 100%
              border-radius 50%
        .play-lyric-wrapper
          width 80%
          margin 30px auto 0 auto
          overflow hidden
          text-align center
          .play-lyric
            height 20px
            line-height 20px
            font-size $font-size-medium
            color: $color-text-lyric
      .middle-r
        display inline-block
        vertical-align top
        width 100%
        height 100%
        overflow hidden
        .lyric-wrapper
          width 80%
          margin 0 auto
          overflow hidden
          text-align center
          .text
            line-height 32px
            color $color-text-lyric
            font-size $font-size-medium
            &.current
              color: $color-text
    .bottom
      position absolute
      bottom 50px
      width 100%
      .dot-wrapper
        text-align center
        font-size 0
        .dot
          display inline-block
          vertical-align middle
          margin 0 4px
          width 8px
          height 8px
          border-radius 50%
          background $color-text-dot
          &.active
            width: 20px
            border-radius: 5px
            background: $color-text-ll
      .progress-wrapper
        display flex
        align-items center
        width 80%
        margin 0 auto
        padding 10px 0
        .time
          color: $color-text-ll
          font-size: $font-size-small
          flex: 0 0 30px
          line-height: 30px
          width: 30px
          &.time-l
            text-align: left
          &.time-r
            text-align: right
        .progress-bar-wrapper
          flex: 1
      .operators
        display: flex
        align-items: center
        .icon
          flex 1
          color $color-icon-white
          &.disable
            color $color-theme-d
          i
            font-size 30px
        .i-left
          text-align right 
        .i-center
          padding 0 20px
          text-align center
          i
            font-size 40px
        .i-right
          text-align left 
        .icon-favorite
          color $color-sub-theme
    &.normal-enter-active, &.normal-leave-active
      transition: all 0.4s
      .top, .bottom
        transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
    &.normal-enter, &.normal-leave-to
      opacity: 0
      .top
        transform: translate3d(0, -100px, 0)
      .bottom
        transform: translate3d(0, 100px, 0)
  .mini-player
    display flex
    align-items center
    position fixed
    left 0
    bottom 0
    z-index 180
    width 100%
    height 60px
    background $color-highlight-background
    &.mini-enter-active, &.mini-leave-active
      transition: all 0.4s
    &.mini-enter, &.mini-leave-to
      opacity: 0
    .icon
      flex 0 0 40px
      width 40px
      padding 0 10px 0 20px
      img 
        border-radius 50%
        &.play
          animation rotate 10s linear infinite
        &.pause
          animation-play-state paused
    .text
      display flex
      flex-direction column
      justify-content center
      flex 1
      line-height 20px
      overflow hidden
      .name
        margin-bottom 2px
        no-warp()
        font-size $font-size-medium
        color $color-text-dissname
      .desc
        no-warp()
        font-size: $font-size-small
        color: $color-text-d
    .control
      flex 0 0 30px
      width 30px
      padding 0 10px
      .icon-play-mini, .icon-pause-mini, .icon-playlist
        font-size 30px
        color $color-theme-d
      .icon-mini
        font-size 32px
        position absolute
        left 0
        top 0
@keyframes rotate
  0%
    transform: rotate(0)
  100%
    transform: rotate(360deg)  
</style>
