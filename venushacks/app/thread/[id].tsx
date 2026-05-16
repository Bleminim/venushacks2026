import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useCommunity, type Comment } from '@/context/CommunityContext';

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, isLast }: { comment: Comment; isLast: boolean }) {
  return (
    <>
      <View style={styles.commentRow}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>
            {comment.author[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentMeta}>
            <Text style={styles.commentAuthor}>{comment.author}</Text>
            <Text style={styles.commentTime}>{comment.timestamp}</Text>
          </View>
          <Text style={styles.commentText}>{comment.body}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.commentDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { posts, toggleUpvote, addComment } = useCommunity();
  const listRef = useRef<FlatList>(null);

  const [replyText, setReplyText] = useState('');

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Post not found.</Text>
      </SafeAreaView>
    );
  }

  function handleSend() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    addComment(post!.id, 'You', trimmed);
    setReplyText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const ListHeader = (
    <View>
      {/* ── Back button ── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={13} color="#9B59B6" />
        <Text style={styles.backText}>Community</Text>
      </TouchableOpacity>

      {/* ── Original post ── */}
      <View style={styles.postCard}>
        <View style={styles.postMeta}>
          <View style={styles.authorChip}>
            <Text style={styles.authorChipText}>{post.authorName}</Text>
          </View>
          <View style={[styles.categoryPill, { backgroundColor: '#F5EEF8' }]}>
            <Text style={[styles.categoryPillText, { color: '#6C3483' }]}>{post.category}</Text>
          </View>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postBody}>{post.body}</Text>

        {/* Upvote row */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.upvoteBtn}
            onPress={() => toggleUpvote(post.id)}
            activeOpacity={0.75}
          >
            <FontAwesome
              name="arrow-up"
              size={13}
              color={post.upvoted ? '#fff' : '#9B59B6'}
            />
            <Text style={[styles.upvoteCount, post.upvoted && styles.upvoteCountActive]}>
              {post.upvoteCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.replyCountChip}>
            <FontAwesome name="comment-o" size={12} color="#9B59B6" />
            <Text style={styles.replyCountText}>
              {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Thread label ── */}
      <Text style={styles.threadLabel}>Thread</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <FlatList
          ref={listRef}
          style={styles.scroll}
          contentContainerStyle={styles.container}
          data={post.comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <CommentRow
              comment={item}
              isLast={index === post.comments.length - 1}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <FontAwesome name="comment-o" size={28} color="#D7BDE2" />
              <Text style={styles.emptyText}>No replies yet. Be the first to respond.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
        />

        {/* ── Reply input ── */}
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Add a reply…"
            placeholderTextColor="#C5BAD0"
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!replyText.trim()}
            activeOpacity={0.8}
          >
            <FontAwesome name="send" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#F8F4F9' },
  flex:  { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 8 },

  notFound: { textAlign: 'center', marginTop: 60, fontSize: 16, color: '#aaa' },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 15, color: PURPLE, fontWeight: '500' },

  // ── Original post card ──
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  authorChip: {
    backgroundColor: '#F0EBF5',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  authorChipText: { fontSize: 12, fontWeight: '600', color: '#6C3483' },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700' },

  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 25,
    marginBottom: 10,
  },
  postBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EBF5',
    paddingTop: 14,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5EEF8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upvoteCount:       { fontSize: 13, fontWeight: '700', color: PURPLE },
  upvoteCountActive: { color: '#6C3483' },

  replyCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyCountText: { fontSize: 13, color: PURPLE, fontWeight: '500' },

  // ── Thread label ──
  threadLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 14,
  },

  // ── Comment rows ──
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8D5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: { fontSize: 14, fontWeight: '700', color: PURPLE },
  commentBody: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 5,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  commentTime:   { fontSize: 11, color: '#bbb' },
  commentText:   { fontSize: 14, color: '#444', lineHeight: 21 },
  commentDivider: { height: 1, backgroundColor: '#F0EBF5', marginLeft: 46 },

  // ── Empty state ──
  emptyComments: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center' },

  // ── Reply bar ──
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0EBF5',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8F4F9',
    borderWidth: 1.5,
    borderColor: '#E8E0EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#D5C9E0', shadowOpacity: 0 },
});
