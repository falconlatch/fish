import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  Modal,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Custom Chip Component
const Chip = ({ label, selected, onPress, onDelete }) => {
  return (
    <View style={styles.chipContainer}>
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
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.chipDeleteButton}>
          <Text style={styles.chipDeleteText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const AVAILABLE_INTERESTS = [
  'Sports', 'Music', 'Cooking', 'Travel', 'Reading', 
  'Movies', 'Gaming', 'Fitness', 'Art', 'Photography'
];

export const ProfileScreen = ({ navigation }) => {
  // Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [interests, setInterests] = useState([]);
  const [customInterests, setCustomInterests] = useState([]);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [tempInterests, setTempInterests] = useState([]);
  const [tempCustomInterests, setTempCustomInterests] = useState([]);

  // Load User Profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          setName(profileData.name);
          setAge(profileData.age);
          setImages(profileData.images);
          setInterests(profileData.interests || []);
          setCustomInterests(profileData.customInterests || []);
          setDescription(profileData.description || '');
        }
      } catch (error) {
        console.error('Error loading profile', error);
      }
    };

    loadProfile();
  }, []);

  // Image Picker
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled) {
        setImages([...images, ...result.assets.map(asset => asset.uri)]);
      }
    } catch (error) {
      console.error('Image Picker Error', error);
      Alert.alert('Error', 'Could not pick images');
    }
  };

  // Delete Image
  const deleteImage = (uriToDelete) => {
    setImages(images.filter(uri => uri !== uriToDelete));
  };

  // Handle Interest Selection in Modal
  const toggleInterest = (interest) => {
    setTempInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // Add Custom Interest
  const addCustomInterest = (interest) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !tempCustomInterests.includes(trimmedInterest)) {
      setTempCustomInterests(prev => [...prev, trimmedInterest]);
      setTempInterests(prev => [...prev, trimmedInterest]);
    }
  };

  // Save Interests
  const saveInterests = () => {
    setInterests(tempInterests);
    setCustomInterests(tempCustomInterests);
    setShowInterestModal(false);
  };

  // Remove Interest
  const removeInterest = (interestToRemove) => {
    setInterests(interests.filter(i => i !== interestToRemove));
    setCustomInterests(customInterests.filter(i => i !== interestToRemove));
  };

  // Edit Profile
  const toggleEditMode = () => {
    if (isEditing) {
      // Reset values when canceling edit
      const resetEdit = async () => {
        try {
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const profileData = JSON.parse(storedProfile);
            setName(profileData.name);
            setAge(profileData.age);
            setImages(profileData.images);
            setInterests(profileData.interests || []);
            setCustomInterests(profileData.customInterests || []);
            setDescription(profileData.description || '');
          }
        } catch (error) {
          console.error('Error resetting profile', error);
        }
      };
      resetEdit();
    } else {
      // Prepare for editing
      setTempInterests([...interests, ...customInterests]);
      setTempCustomInterests([...customInterests]);
    }
    setIsEditing(!isEditing);
  };

  // Save Profile
  const saveProfile = async () => {
    // Validate inputs
    if (!name || !age) {
      Alert.alert('Validation Error', 'Name and age are required');
      return;
    }

    try {
      // Get existing profile data
      const storedProfile = await AsyncStorage.getItem('userProfile');
      const profileData = storedProfile ? JSON.parse(storedProfile) : {};

      // Update profile data
      const updatedProfile = {
        ...profileData,
        name,
        age,
        description,
        images,
        interests: tempInterests.filter(interest => !customInterests.includes(interest)),
        customInterests: tempCustomInterests
      };

      // Save updated profile
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      setIsEditing(false);
    } catch (error) {
      console.error('Profile Save Error', error);
      Alert.alert('Error', 'Could not save profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace("/home")}
          >
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={isEditing ? saveProfile : toggleEditMode}
          >
            <MaterialIcons 
              name={isEditing ? 'save' : 'edit'} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.profileImage} />
              {isEditing && (
                <TouchableOpacity 
                  style={styles.deleteImageButton}
                  onPress={() => deleteImage(uri)}
                >
                  <Text style={styles.deleteImageText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {isEditing && images.length < 5 && (
            <TouchableOpacity 
              style={styles.addImageButton}
              onPress={pickImage}
            >
              <Text style={styles.addImageText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Personal Info */}
        <View style={styles.infoContainer}>
          {isEditing ? (
            <>
              <TextInput
                style={styles.editInput}
                value={name}
                onChangeText={setName}
                placeholder="Name"
              />
              <TextInput
                style={styles.editInput}
                value={age}
                onChangeText={setAge}
                placeholder="Age"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.editInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about yourself"
                multiline={true}
              />
            </>
          ) : (
            <>
              <Text style={styles.nameText}>{name}, {age}</Text>
              {description ? (
                <Text style={styles.descriptionText}>{description}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Interests */}
        <View style={styles.interestsSection}>
          <View style={styles.interestHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => {
                setShowInterestModal(true);
                setTempInterests([...interests, ...customInterests]);
                setTempCustomInterests([...customInterests]);
              }}>
                <Text style={styles.addInterestText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.interestsContainer}>
            {[...interests, ...customInterests].map(interest => (
              <Chip
                key={interest}
                label={interest}
                selected={true}
                onDelete={isEditing ? () => removeInterest(interest) : undefined}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Interests Modal */}
      <Modal
        visible={showInterestModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Interests</Text>
            <TextInput
              style={styles.customInterestInput}
              placeholder="Add Custom Interest"
              onSubmitEditing={(event) => {
                addCustomInterest(event.nativeEvent.text);
                event.target.clear();
              }}
              returnKeyType="done"
            />
            <ScrollView>
              <View style={styles.interestsContainer}>
                {AVAILABLE_INTERESTS.map(interest => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={tempInterests.includes(interest)}
                    onPress={() => toggleInterest(interest)}
                  />
                ))}
                {tempCustomInterests.map(interest => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={tempInterests.includes(interest)}
                    onPress={() => toggleInterest(interest)}
                  />
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowInterestModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={saveInterests}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    padding: 10,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 10,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  imageGalleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  imageWrapper: {
    position: 'relative',
    margin: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
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
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  addImageText: {
    fontSize: 30,
    color: '#007AFF',
  },
  infoContainer: {
    padding: 15,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: 'black',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
  },

  customInterestInput: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },

  interestsSection: {
    padding: 15,
  },
  interestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addInterestText: {
    color: '#007AFF',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
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
  chipDeleteButton: {
    marginLeft: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipDeleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  modalSaveButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;