export const singer = state => state.singer

export const playing = state => state.playing

export const fullScreen = state => state.fullScreen

export const playList = state => state.playList

export const sequenceList = state => state.sequenceList

export const mode = state => state.mode

export const currentIndex = state => state.currentIndex
// getters还可以担任计算的角色
export const currentSong = (state) => {
  return state.playList[state.currentIndex] || {}
}