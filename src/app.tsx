import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useStudyRoomStore } from '@/store';
import './app.scss';

function App(props) {
  const startGlobalTimer = useStudyRoomStore((s) => s.startGlobalTimer);

  useEffect(() => {
    startGlobalTimer();
  }, [startGlobalTimer]);

  useDidShow(() => {
    useStudyRoomStore.getState().releaseTimeoutSeats();
    useStudyRoomStore.getState().releaseAwayTimeout();
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
