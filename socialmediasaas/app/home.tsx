import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { UserIcon, SettingsIcon, MessageCircleIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const mockUsers = [
  { 
    id: '1', 
    name: 'John Doe', 
    interests: 'Photography, Hiking, Technology', 
    bio: 'Adventure seeker and tech enthusiast looking to connect locally!' 
  },
  { 
    id: '2', 
    name: 'Jane Smith', 
    interests: 'Cooking, Music, Travel', 
    bio: 'Passionate about exploring new cuisines and discovering local gems.' 
  },
  { 
    id: '3', 
    name: 'Alex Johnson', 
    interests: 'Reading, Cycling, Art', 
    bio: 'Creative mind with a passion for exploration and learning.' 
  }
];

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const HomeScreen: React.FC = () => {
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const updateUserIndex = useCallback((direction: number) => {
    setCurrentUserIndex((prevIndex) => 
      (prevIndex + direction + mockUsers.length) % mockUsers.length
    );
    // Reset shared values immediately
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
  }, [mockUsers.length]);

  const gestureHandler = useCallback((event: any) => {
    const { state, translationX, translationY } = event.nativeEvent;
    
    switch (state) {
      case State.ACTIVE:
        // Update translation during active gesture
        translateX.value = translationX;
        translateY.value = translationY;
        break;
      
      case State.END:
        if (Math.abs(translationX) > SWIPE_THRESHOLD) {
          const direction = translationX > 0 ? 1 : -1;
          
          // Animate off-screen with opacity fade
          translateX.value = withSpring(direction * width, { damping: 20, stiffness: 200 });
          opacity.value = withSpring(0, { damping: 20, stiffness: 200 }, () => {
            // Update index and reset values
            runOnJS(updateUserIndex)(direction);
          });
        } else {
          // Return to center with spring
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
        break;
    }
  }, [updateUserIndex]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value, 
      [-width, 0, width], 
      [-15, 0, 15], 
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` }
      ],
      opacity: opacity.value
    };
  });

  const currentUser = mockUsers[currentUserIndex];
  const nextUser = mockUsers[(currentUserIndex + 1) % mockUsers.length];

  const handleSwipe = useCallback((direction: number) => {
    // Programmatic swipe with animation
    translateX.value = withSpring(direction * width, { damping: 20, stiffness: 200 });
    opacity.value = withSpring(0, { damping: 20, stiffness: 200 }, () => {
      runOnJS(updateUserIndex)(direction);
    });
  }, [updateUserIndex]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNavigation}>
        <TouchableOpacity onPress={() => router.replace("/profile")} style={styles.iconButton}>
          <UserIcon size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <SettingsIcon size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Swipeable User Cards */}
      <GestureHandlerRootView style={styles.gestureContainer}>
        {/* Next User Card (Immediate Background) */}
        <View style={[styles.userCard, styles.nextUserCard]}>
          <View style={styles.userImageContainer}>
            <Text style={styles.userImagePlaceholder}>User Image</Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{nextUser.name}</Text>
            <Text style={styles.userInterests}>{nextUser.interests}</Text>
            <Text style={styles.userBio}>{nextUser.bio}</Text>
          </View>
        </View>

        {/* Current User Card */}
        <PanGestureHandler onHandlerStateChange={gestureHandler}>
          <Animated.View style={[styles.userCard, animatedStyle]}>
            <View style={styles.userImageContainer}>
              <Text style={styles.userImagePlaceholder}>User Image</Text>
            </View>
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userInterests}>{currentUser.interests}</Text>
              <Text style={styles.userBio}>{currentUser.bio}</Text>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.swipeLeftButton} 
          onPress={() => handleSwipe(-1)}
        >
          <ChevronLeftIcon size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.chatButton}>
          <MessageCircleIcon size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.swipeRightButton} 
          onPress={() => handleSwipe(1)}
        >
          <ChevronRightIcon size={24} color="white" />
        </TouchableOpacity>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  iconButton: {
    padding: 10,
  },
  gestureContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  userCard: {
    position: 'absolute',
    width: width * 0.85,
    height: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  nextUserCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  userImageContainer: {
    width: '100%',
    height: '75%',
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userImagePlaceholder: {
    color: '#666',
    fontSize: 18,
  },
  userDetails: {
    padding: 15,
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userInterests: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  swipeLeftButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 50,
  },
  swipeRightButton: {
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 50,
  },
  chatButton: {
    backgroundColor: '#5f27cd',
    padding: 15,
    borderRadius: 50,
  },
});

export default HomeScreen;