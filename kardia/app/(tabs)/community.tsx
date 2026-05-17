import { useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useCommunity, type Post } from '@/context/CommunityContext';
import { Colors, Fonts } from '@/constants/theme';

// ─── Category pill ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Postpartum BP':          { bg: '#F0DDE2', text: '#7D2235' },
  'Gestational Diabetes':   { bg: '#F0E6D6', text: '#9A6B2E' },
  'Postpartum Anxiety':     { bg: '#DDE8F0', text: Colors.burgundy },
  'A1C & Long-Term Health': { bg: '#D8EBE3', text: '#3A7A5A' },
  'Advocacy':               { bg: Colors.blush, text: Colors.burgundy },
};

function CategoryPill({ label }: { label: string }) {
  const colors = CATEGORY_COLORS[label] ?? { bg: Colors.blush, text: Colors.wine };
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const { toggleUpvote } = useCommunity();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/thread/${post.id}`)}
      activeOpacity={0.92}
    >
      {/* Top row: category + author */}
      <View style={styles.cardMeta}>
        <CategoryPill label={post.category} />
        <View style={styles.authorWrap}>
          {post.authorImage ? (
            <Image source={{ uri: post.authorImage }} style={styles.authorAvatar} />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.authorAvatarText}>{post.authorName[0].toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.author}>{post.authorName}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.postTitle}>{post.title}</Text>

      {/* Body snippet */}
      <Text style={styles.postSnippet} numberOfLines={2}>{post.body}</Text>

      {/* Action row */}
      <View style={styles.actionRow}>
        {/* Upvote */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={(e) => { e.stopPropagation?.(); toggleUpvote(post.id); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FontAwesome
            name="arrow-up"
            size={13}
            color={post.upvoted ? Colors.wine : Colors.borderCard}
          />
          <Text style={[styles.actionCount, post.upvoted && styles.actionCountActive]}>
            {post.upvoteCount}
          </Text>
        </TouchableOpacity>

        {/* Comment count */}
        <View style={styles.actionBtn}>
          <FontAwesome name="comment-o" size={13} color={Colors.borderCard} />
          <Text style={styles.actionCount}>{post.comments.length}</Text>
        </View>

        {/* Read thread cue */}
        <Text style={styles.readThread}>Read thread →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CommunityScreen() {
  const { top }   = useSafeAreaInsets();
  const { posts } = useCommunity();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(posts.map(p => p.category)));
    return ['All', ...unique];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <View style={styles.screenWrap}>
      <LinearGradient
        colors={['#FBF7F0', '#F5EFE6', '#F0DDD0']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>Together We're Stronger</Text>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSub}>
              Real experiences from mothers navigating maternal health. Tap a post to join the conversation.
            </Text>

            {/* ── Search Bar ── */}
            <View style={styles.searchContainer}>
              <FontAwesome name="search" size={16} color={Colors.borderCard} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search posts..."
                placeholderTextColor={Colors.borderCard}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            {/* ── Category Filter ── */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterPill,
                    selectedCategory === cat && styles.filterPillActive
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.filterPillText,
                    selectedCategory === cat && styles.filterPillTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <PostCard post={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={<View style={{ height: 32 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={32} color={Colors.blush} />
            <Text style={styles.emptyText}>No posts found matching your criteria.</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  scroll:    { flex: 1 },
  container: { padding: 20, paddingBottom: 130 },

  header: { marginBottom: 8, marginTop: 4 },
  headerEyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: 'rgba(140,58,77,0.5)',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 25,
    color: Colors.textDark,
    marginTop: 2,
  },
  headerSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 19,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  filterScroll: { gap: 8, paddingBottom: 16 },
  filterPill: {
    backgroundColor: Colors.ivory,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  filterPillActive: {
    backgroundColor: Colors.wine,
    borderColor: Colors.wine,
  },
  filterPillText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.wine,
  },
  filterPillTextActive: {
    color: Colors.cream,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 16,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  pill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },

  authorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12 },
  authorAvatarPlaceholder: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.blush,
    alignItems: 'center', justifyContent: 'center'
  },
  authorAvatarText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    color: Colors.wine,
  },
  author: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  postTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: Colors.textDark,
    lineHeight: 21,
    marginBottom: 6,
  },
  postSnippet: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
    marginBottom: 14,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderCard,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.borderCard,
  },
  actionCountActive: { color: Colors.wine },

  readThread: {
    marginLeft: 'auto',
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
  },
});
