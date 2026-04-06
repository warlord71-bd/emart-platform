import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const SearchBar = ({ onSearch, placeholder = 'Search...', dark = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim()) onSearch?.(query.trim());
  };

  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      <Ionicons name="search" size={16} color={dark ? 'rgba(255,255,255,0.5)' : COLORS.textLight} />
      <TextInput
        style={[styles.input, dark && styles.inputDark]}
        placeholder={placeholder}
        placeholderTextColor={dark ? 'rgba(255,255,255,0.4)' : COLORS.textLight}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => { setQuery(''); onSearch?.(''); }}>
          <Ionicons name="close-circle" size={16} color={dark ? 'rgba(255,255,255,0.5)' : COLORS.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F4F8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  inputDark: {
    color: '#fff',
  },
});

export default SearchBar;
