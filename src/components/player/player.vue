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
    <div class="middle">
      <div class="middle-l">
        <div class="cd-wrapper" ref="cdWrapper">
          <div class="cd" :class="cdRotate">
            <img class="image" :src="currentSong.image">
          </div>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="dot-wrapper">
        <span class="dot"> </span>
        <span class="dot"> </span>
      </div>
      <div class="progress-wrapper">
        <span class="time time-l">{{format(currentTime)}}</span>
        <div class="progress-bar-wrapper">
          <progressBar :percent="percent" @percentChange="onPercentChange"></progressBar>
        </div>
        <span class="time time-r">{{format(currentSong.duration)}}</span>
      </div>
      <div class="operators">
        <div class="icon i-left">
          <i class="icon-sequence"></i>
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
      <i :class="miniIcon" @click.stop="togglePlaying"></i>
    </div>
    <div class="control">
      <i class="icon-playlist"></i>
    </div>
  </div>
  </transition>
  <audio ref="audio" :src="currentSong.url" @canplay="ready" @timeupdate="updateTime" 
  @error="error"></audio>
</div>
</template>

<script type="text/ecmascript-6">
import {mapGetters, mapMutations} from 'vuex'
import animations from 'create-keyframe-animation'
import {prefixStyle} from 'common/js/dom'
import progressBar from '@/base/progress-bar/progress-bar'

const transform = prefixStyle('transform')
export default {
  data() {
    return {
      songReady: false,
      currentTime: 0
    }
  },
  computed: {
    ...mapGetters([
      'fullScreen',
      'playList',
      'currentSong',
      'playing',
      'currentIndex'
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
      this.setPlayingState(!this.playing)
    },
    prev() {
      if (!this.songReady) {
        return
      }
      let index = this.currentIndex - 1
      if (index === -1) {
        index = this.playList.length - 1
      }
      this.setCurrentIndex(index)
      if (!this.playing) {
        this.togglePlaying()
      }
      this.songReady = false
    },
    next() {
      if (!this.songReady) {
        return
      }
      let index = this.currentIndex + 1
      if (index === this.playList.length) {
        index = 0
      }
      this.setCurrentIndex(index)
      if (!this.playing) {
        this.togglePlaying()
      }
      this.songReady = false
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
      this.$refs.audio.currentTime = newPercent * this.currentSong.duration
    },
    ...mapMutations({
      setFullScreen: 'SET_FULLSCREEN',
      setPlayingState: 'SET_PLAYING',
      setCurrentIndex: 'SET_CURRENT_INDEX'
    })
  },
  watch: {
    currentSong() {
      setTimeout(() => {
        this.$refs.audio.play()
      }, 20)
    },
    playing(newPlaying) {
      const audio = this.$refs.audio
      setTimeout(() => {
        newPlaying ? audio.play() : audio.pause()
      }, 20)
    }
  },
  components: {
    progressBar
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
            color: $color-text-l
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
            color $color-text-l
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
