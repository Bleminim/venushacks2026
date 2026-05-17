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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { useCommunity, type Post } from '@/context/CommunityContext';

// ─── Category pill ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Postpartum BP':        { bg: '#FDEDEC', text: '#C0392B' },
  'Gestational Diabetes': { bg: '#FEF9E7', text: '#B7770D' },
  'Postpartum Anxiety':   { bg: '#EBF5FB', text: '#1A5276' },
  'A1C & Long-Term Health': { bg: '#EAFAF1', text: '#1E8449' },
  'Advocacy':             { bg: '#F5EEF8', text: '#6C3483' },
};

function CategoryPill({ label }: { label: string }) {
  const colors = CATEGORY_COLORS[label] ?? { bg: '#F0EBF5', text: '#9B59B6' };
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
            name={post.upvoted ? 'arrow-up' : 'arrow-up'}
            size={13}
            color={post.upvoted ? '#9B59B6' : '#bbb'}
          />
          <Text style={[styles.actionCount, post.upvoted && styles.actionCountActive]}>
            {post.upvoteCount}
          </Text>
        </TouchableOpacity>

        {/* Comment count */}
        <View style={styles.actionBtn}>
          <FontAwesome name="comment-o" size={13} color="#bbb" />
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
            <FontAwesome name="search" size={16} color="#C5BAD0" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor="#C5BAD0"
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
          <FontAwesome name="search" size={32} color="#D7BDE2" />
          <Text style={styles.emptyText}>No posts found matching your criteria.</Text>
        </View>
      }
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20, paddingBottom: 20 },

  header: { marginBottom: 8, marginTop: 4 },
  headerEyebrow: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle:   { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  headerSub:     { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
  },
  filterScroll: { gap: 8, paddingBottom: 16 },
  filterPill: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8D5F5',
  },
  filterPillActive: {
    backgroundColor: '#9B59B6',
    borderColor: '#9B59B6',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C3483',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
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
  pillText: { fontSize: 11, fontWeight: '700' },

  authorWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12 },
  authorAvatarPlaceholder: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8D5F5',
    alignItems: 'center', justifyContent: 'center'
  },
  authorAvatarText: { fontSize: 10, fontWeight: '700', color: '#9B59B6' },
  author: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 21,
    marginBottom: 6,
  },
  postSnippet: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
    marginBottom: 14,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EBF5',
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount:       { fontSize: 13, color: '#bbb', fontWeight: '600' },
  actionCountActive: { color: '#9B59B6' },

  readThread: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#9B59B6',
    fontWeight: '600',
  },
});
