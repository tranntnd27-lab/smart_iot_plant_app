import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PlantHealthInfo } from '../types/plant';

interface PlantHealthCardProps {
  healthInfo: PlantHealthInfo;
}

export const PlantHealthCard: React.FC<PlantHealthCardProps> = ({ healthInfo }) => {
  return (
    <View style={[styles.card, { backgroundColor: healthInfo.color }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{healthInfo.iconName}</Text>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{healthInfo.title}</Text>
          {healthInfo.score > 0 && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{healthInfo.score} điểm</Text>
            </View>
          )}
        </View>
        <Text style={styles.description}>{healthInfo.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 26,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  scoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
  },
});
