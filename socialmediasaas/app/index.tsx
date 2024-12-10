import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView,
  Alert,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamic Progress Indicator
const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <View style={styles.progressContainer}>
      {[...Array(steps)].map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.progressStep, 
            index < currentStep ? styles.progressStepComplete : 
            index === currentStep ? styles.progressStepCurrent : 
            styles.progressStepIncomplete
          ]}
        />
      ))}
    </View>
  );
};

// Custom Chip Component
const Chip = ({ label, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip, 
        selected && styles.selectedChip
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText, 
        selected && styles.selectedChipText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const INTERESTS = ['Sports', 'Music', 'Cooking', 'Travel', 'Reading', 'Movies', 'Gaming', 'Fitness', 'Art', 'Photography'];
const GENDERS = ['Male', 'Female'];

export const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [customInterests, setCustomInterests] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleAppleSignIn = async () => {
    dismissKeyboard();
    if (Platform.OS !== 'ios') {
      Alert.alert('Invalid Platform', 'Apple Sign-In is only available on iOS devices');
      return;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('Apple Sign-In Credential:', credential);
      
      const { email, fullName } = credential;
      setEmail(email || '');
      setName(`${fullName?.givenName || ''} ${fullName?.familyName || ''}`.trim());
      
      setStep(1);
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User canceled Apple Sign-In');
      } else {
        console.error('Apple Sign-In Error', error);
        Alert.alert('Sign In Error', 'Could not sign in with Apple');
      }
    }
  };

  const handleGoBack = () => {
    dismissKeyboard();
    setStep(Math.max(0, step - 1));
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setStep(2);
      } else {
        Alert.alert(
          'Location Permission Required', 
          'Please enable location to continue using the app'
        );
      }
    } catch (error) {
      console.error('Location Permission Error', error);
      Alert.alert('Error', 'Could not request location permissions');
    }
  };

  const pickImage = async () => {
    try {
      if (images.length >= 5) {
        Alert.alert('Image Limit', 'You can only upload a maximum of 5 pictures');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled) {
        // Check for duplicate images
        const newUris = result.assets.map(asset => asset.uri);
        const uniqueNewUris = newUris.filter(uri => 
          !images.some(existingUri => existingUri === uri)
        );

        if (uniqueNewUris.length !== newUris.length) {
          Alert.alert('Duplicate Image', 'You have already added this image.');
        }

        // Only add unique images, ensuring total doesn't exceed 5
        setImages(prev => {
          const updatedImages = [...prev, ...uniqueNewUris];
          return updatedImages.slice(0, 5);
        });
      }
    } catch (error) {
      console.error('Image Picker Error', error);
      Alert.alert('Error', 'Could not pick images');
    }
  };

  // New method to delete an image
  const deleteImage = (uriToDelete) => {
    setImages(images.filter(uri => uri !== uriToDelete));
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = (interest) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !customInterests.includes(trimmedInterest)) {
      setCustomInterests(prev => [...prev, trimmedInterest]);
      setSelectedInterests(prev => [...prev, trimmedInterest]);
    }
  };

  const handleCreateAccount = () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    
    setStep(1);
  };

  const handleCompleteProfile = async () => {
    if (!name || !age || !gender || images.length === 0 || selectedInterests.length === 0) {
      Alert.alert('Validation Error', 'Please complete all profile fields');
      return;
    }
    
    // Prepare profile data
    const profileData = {
      email,
      name,
      age,
      gender,
      images,
      interests: selectedInterests,
      customInterests
    };

    try {
      // Store profile data in AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      
      // Navigate to home screen
      router.replace("/home");
    } catch (error) {
      console.error('Profile Storage Error', error);
      Alert.alert('Error', 'Could not save profile data');
    }
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}
            >
              <Text style={styles.title}>Welcome to ProximityMatch</Text>
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={[styles.socialButton, styles.appleButton]} 
                  onPress={handleAppleSignIn}
                >
                  <Image source={require('@/assets/apple-icon.png')} style={styles.appleLogo} />
                  <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </TouchableOpacity>
              )}
              <View style={styles.emailContainer}>
                <TextInput
                  style={[styles.input, { color: '#000' }]}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: '#000' }]}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordVisibilityIcon}
                  >
                    <Feather 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={24} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={() => {
                    dismissKeyboard();
                    handleCreateAccount();
                  }}
                >
                  <Text style={styles.buttonText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        );
      
      case 1:
        return (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.container}>
              <Text style={styles.title}>Location Access</Text>
              <Text style={styles.subtitle}>
                We need your location to help you connect with people nearby
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={requestLocationPermission}
              >
                <Text style={styles.buttonText}>Allow Location Access</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleGoBack}
              >
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        );
      
      case 2:
        return (
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView 
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>Complete Your Profile</Text>
              
              <Text style={styles.imageUploadText}>Upload Photos (Max 5)</Text>
              <View style={styles.imageUploadContainer}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image 
                      source={{ uri }} 
                      style={styles.uploadedImage} 
                    />
                    <TouchableOpacity 
                      style={styles.deleteImageButton}
                      onPress={() => deleteImage(uri)}
                    >
                      <Text style={styles.deleteImageText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity 
                    style={styles.imageUploadButton}
                    onPress={pickImage}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Your Name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Your Age"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                returnKeyType="next"
              />
              <View style={styles.genderContainer}>
                {GENDERS.map((currentGender) => (
                  <TouchableOpacity
                    key={currentGender}
                    style={[
                      styles.genderButton,
                      gender === currentGender && styles.selectedGenderButton
                    ]}
                    onPress={() => setGender(currentGender)}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      gender === currentGender && styles.selectedGenderButtonText
                    ]}>
                      {currentGender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Add Custom Interest"
                placeholderTextColor="#666"
                onSubmitEditing={(event) => addCustomInterest(event.nativeEvent.text)}
                returnKeyType="done"
              />

              <Text style={styles.sectionTitle}>Select Your Interests</Text>
              <View style={styles.interestsContainer}>
                {INTERESTS.map(interest => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={selectedInterests.includes(interest)}
                    onPress={() => toggleInterest(interest)}
                  />
                ))}
                {customInterests.map(interest => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={selectedInterests.includes(interest)}
                    onPress={() => toggleInterest(interest)}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => {
                  dismissKeyboard();
                  handleCompleteProfile();
                }}
              >
                <Text style={styles.buttonText}>Complete Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleGoBack}
              >
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderStep()}
      <ProgressIndicator steps={3} currentStep={step} />
      <StatusBar style="dark" />
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // Light black text style
  lightBlackText: {
    color: '#333333', // Light black color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  appleButton: {
    backgroundColor: 'black',
  },
  appleLogo: {
    width: 20,
    height: 20,
    marginRight: 15,
    marginBottom: 4,
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emailContainer: {
    width: '100%',
    marginTop: 20,
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 40, // Make space for the icon
  },
  passwordVisibilityIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255,0,0,0.7)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteImageText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  imageUploadButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  genderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 5,
  },
  selectedGenderButton: {
    backgroundColor: '#007AFF',
  },
  genderButtonText: {
    color: '#000',
  },
  selectedGenderButtonText: {
    color: '#FFFFFF',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  selectedChip: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#000',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  progressBar: {
    width: '100%',
    marginTop: 10,
  },  
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  progressStep: {
    height: 6,
    width: 50,
    marginHorizontal: 4,
    borderRadius: 3,
  },
  progressStepIncomplete: {
    backgroundColor: '#E0E0E0',
  },
  progressStepCurrent: {
    backgroundColor: '#007AFF',
  },
  progressStepComplete: {
    backgroundColor: '#007AFF',
  },
});

export default OnboardingScreen;